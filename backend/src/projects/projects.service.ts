import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /** Assert user is a member of the workspace */
  private async assertWorkspaceAccess(workspaceId: number, userId: number, userRole: Role) {
    if (userRole === Role.ADMIN) return;
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
  }

  /** Assert user is a manager or ADMIN for the project */
  private async assertProjectManager(projectId: number, userId: number, userRole: Role) {
    if (userRole === Role.ADMIN) return;
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member || member.role !== ProjectRole.MANAGER) {
      throw new ForbiddenException('Only project managers or ADMIN can perform this action');
    }
  }

  /** Create a project in a workspace */
  async create(
    data: {
      name: string;
      description?: string;
      workspaceId: number;
      startDate?: string;
      endDate?: string;
    },
    userId: number,
    userRole: Role,
  ) {
    // Check workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: data.workspaceId, isActive: true, isDeleted: false },
    });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${data.workspaceId} not found`);
    }

    // Only ADMIN or workspace owner/manager can create projects
    await this.assertWorkspaceAccess(data.workspaceId, userId, userRole);

    if (userRole !== Role.ADMIN && userRole !== Role.PROJECT_MANAGER) {
      throw new ForbiddenException('Only PROJECT_MANAGER or ADMIN can create projects');
    }

    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        workspaceId: data.workspaceId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        members: {
          create: {
            userId,
            role: ProjectRole.MANAGER,
          },
        },
      },
      include: {
        workspace: { select: { id: true, name: true } },
        _count: { select: { members: true, tasks: true } },
      },
    });

    return project;
  }

  /** List projects in a workspace */
  async findAll(workspaceId: number, userId: number, userRole: Role) {
    await this.assertWorkspaceAccess(workspaceId, userId, userRole);

    const where: any = { workspaceId, isActive: true, isDeleted: false, workspace: { isDeleted: false } };

    // MEMBERs can only see projects they are part of
    if (userRole === Role.MEMBER) {
      where.members = { some: { userId } };
    }

    return this.prisma.project.findMany({
      where,
      include: {
        _count: { select: { members: true, tasks: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single project */
  async findOne(id: number, userId: number, userRole: Role) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true, isDeleted: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
        tasks: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true,
            assignee: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!project || !project.isActive || project.isDeleted || project.workspace.isDeleted) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    // Check access
    if (userRole !== Role.ADMIN) {
      const isMember = project.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this project');
      }
    }

    return project;
  }

  /** Update project details */
  async update(
    id: number,
    data: { name?: string; description?: string; startDate?: string; endDate?: string },
    userId: number,
    userRole: Role,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project || !project.isActive || project.isDeleted) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    await this.assertProjectManager(id, userId, userRole);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });
  }

  /** Soft-delete project */
  async remove(id: number, userId: number, userRole: Role) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project || !project.isActive || project.isDeleted) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    await this.assertProjectManager(id, userId, userRole);

    return this.prisma.project.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: new Date() },
      select: { id: true, name: true, isActive: true, isDeleted: true },
    });
  }

  /** Add a member to the project */
  async addMember(
    projectId: number,
    targetUserId: number,
    role: ProjectRole = ProjectRole.MEMBER,
    requesterId: number,
    requesterRole: Role,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.isActive || project.isDeleted) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    await this.assertProjectManager(projectId, requesterId, requesterRole);

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException(`User ${targetUserId} not found`);

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (existing) throw new ConflictException('User is already a member of this project');

    return this.prisma.projectMember.create({
      data: { projectId, userId: targetUserId, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  /** Remove a member from the project */
  async removeMember(
    projectId: number,
    targetUserId: number,
    requesterId: number,
    requesterRole: Role,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.isActive || project.isDeleted) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    await this.assertProjectManager(projectId, requesterId, requesterRole);

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Membership not found');

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    return { message: 'Member removed from project' };
  }

  /** Get project statistics */
  async getStats(projectId: number, userId: number, userRole: Role) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.isActive || project.isDeleted) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (userRole !== Role.ADMIN) {
      const isMember = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!isMember) throw new ForbiddenException('Access denied');
    }

    const [byStatus, byPriority, totalTasks, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { _all: true },
      }),
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({
        where: {
          projectId,
          deadline: { lt: new Date() },
          status: { notIn: ['DONE'] },
        },
      }),
    ]);

    return {
      totalTasks,
      overdueTasks: overdue,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count._all })),
    };
  }
}
