import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ProjectRole, WorkspaceRole } from '@prisma/client';

@Injectable()
export class TrashService {
  constructor(private prisma: PrismaService) {}

  /** List all soft-deleted items visible to the user */
  async findAll(userId: number, userRole: Role) {
    const isSysAdmin = userRole === Role.ADMIN;

    // 1. Fetch soft-deleted Workspaces
    const workspaceWhere: any = { isDeleted: true };
    if (!isSysAdmin) {
      workspaceWhere.deletedById = userId;
    }
    const workspaces = await this.prisma.workspace.findMany({
      where: workspaceWhere,
      select: {
        id: true,
        name: true,
        deletedAt: true,
        ownerId: true,
      },
    });

    // 2. Fetch soft-deleted Projects (whose workspaces are NOT deleted)
    const projectWhere: any = {
      isDeleted: true,
      workspace: { isDeleted: false },
    };
    if (!isSysAdmin) {
      projectWhere.deletedById = userId;
    }
    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        deletedAt: true,
        workspaceId: true,
        workspace: { select: { name: true } },
      },
    });

    // 3. Fetch soft-deleted Tasks (whose projects and workspaces are NOT deleted)
    const taskWhere: any = {
      isDeleted: true,
      project: {
        isDeleted: false,
        workspace: { isDeleted: false },
      },
    };
    if (!isSysAdmin) {
      taskWhere.deletedById = userId;
    }
    const tasks = await this.prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        deletedAt: true,
        projectId: true,
        project: {
          select: {
            name: true,
            workspace: { select: { name: true } },
          },
        },
        creatorId: true,
        assigneeId: true,
      },
    });

    // 4. Map & Combine results
    const mappedWorkspaces = workspaces.map((w) => ({
      id: w.id,
      type: 'workspace',
      name: w.name,
      deletedAt: w.deletedAt,
      workspaceName: '',
      projectName: '',
    }));

    const mappedProjects = projects.map((p) => ({
      id: p.id,
      type: 'project',
      name: p.name,
      deletedAt: p.deletedAt,
      workspaceName: p.workspace?.name || '',
      projectName: '',
    }));

    const mappedTasks = tasks.map((t) => ({
      id: t.id,
      type: 'task',
      name: t.title,
      deletedAt: t.deletedAt,
      workspaceName: t.project?.workspace?.name || '',
      projectName: t.project?.name || '',
    }));

    const allTrashItems = [
      ...mappedWorkspaces,
      ...mappedProjects,
      ...mappedTasks,
    ];

    // Sort by deletedAt desc
    return allTrashItems.sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  /** Restore a soft-deleted item */
  async restore(type: string, id: number, userId: number, userRole: Role) {
    const isSysAdmin = userRole === Role.ADMIN;

    if (type === 'workspace') {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id },
      });
      if (!workspace) throw new NotFoundException('Workspace not found');
      if (!workspace.isDeleted) throw new BadRequestException('Workspace is not deleted');

      // Check permission: Owner, the person who deleted it, or ADMIN
      if (!isSysAdmin && workspace.ownerId !== userId && workspace.deletedById !== userId) {
        throw new ForbiddenException('Only the workspace owner, the person who deleted it, or ADMIN can restore it');
      }

      return this.prisma.workspace.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
          isActive: true,
        },
      });
    }

    if (type === 'project') {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: { workspace: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (!project.isDeleted) throw new BadRequestException('Project is not deleted');

      // If parent workspace is deleted, project cannot be restored
      if (project.workspace.isDeleted) {
        throw new BadRequestException('Cannot restore project because its parent workspace is deleted. Please restore the workspace first.');
      }

      // Check permission: Project Manager, Workspace Owner, the person who deleted it, or ADMIN
      if (!isSysAdmin && project.deletedById !== userId) {
        const workspaceOwner = project.workspace.ownerId === userId;
        const projectMember = await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: id, userId } },
        });
        const isManager = projectMember?.role === ProjectRole.MANAGER;

        if (!workspaceOwner && !isManager) {
          throw new ForbiddenException('Only the person who deleted it, project managers, workspace owners, or ADMIN can restore it');
        }
      }

      return this.prisma.project.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
          isActive: true,
        },
      });
    }

    if (type === 'task') {
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: { workspace: true },
          },
        },
      });
      if (!task) throw new NotFoundException('Task not found');
      if (!task.isDeleted) throw new BadRequestException('Task is not deleted');

      // Check parent project and workspace active state
      if (task.project.isDeleted) {
        throw new BadRequestException('Cannot restore task because its project is deleted. Please restore the project first.');
      }
      if (task.project.workspace.isDeleted) {
        throw new BadRequestException('Cannot restore task because its workspace is deleted. Please restore the workspace first.');
      }

      // Check permission: Project Manager, Creator, Assignee, the person who deleted it, or ADMIN
      if (!isSysAdmin && task.deletedById !== userId) {
        const isCreator = task.creatorId === userId;
        const isAssignee = task.assigneeId === userId;
        const projectMember = await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: task.projectId, userId } },
        });
        const isManager = projectMember?.role === ProjectRole.MANAGER;

        if (!isCreator && !isAssignee && !isManager) {
          throw new ForbiddenException('Only the person who deleted it, project managers, creator, assignee, or ADMIN can restore it');
        }
      }

      return this.prisma.task.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
        },
      });
    }

    throw new BadRequestException(`Invalid type: ${type}`);
  }

  /** Permanently delete an item */
  async permanentDelete(type: string, id: number, userId: number, userRole: Role) {
    const isSysAdmin = userRole === Role.ADMIN;

    if (type === 'workspace') {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id },
      });
      if (!workspace) throw new NotFoundException('Workspace not found');

      // Check permission: Owner, the person who deleted it, or ADMIN
      if (!isSysAdmin && workspace.ownerId !== userId && workspace.deletedById !== userId) {
        throw new ForbiddenException('Only the workspace owner, the person who deleted it, or ADMIN can permanently delete it');
      }

      await this.prisma.workspace.delete({ where: { id } });
      return { message: 'Workspace permanently deleted successfully' };
    }

    if (type === 'project') {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: { workspace: true },
      });
      if (!project) throw new NotFoundException('Project not found');

      // Check permission: Project Manager, Workspace Owner, the person who deleted it, or ADMIN
      if (!isSysAdmin && project.deletedById !== userId) {
        const workspaceOwner = project.workspace.ownerId === userId;
        const projectMember = await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: id, userId } },
        });
        const isManager = projectMember?.role === ProjectRole.MANAGER;

        if (!workspaceOwner && !isManager) {
          throw new ForbiddenException('Only project managers, workspace owners, the person who deleted it, or ADMIN can permanently delete it');
        }
      }

      await this.prisma.project.delete({ where: { id } });
      return { message: 'Project permanently deleted successfully' };
    }

    if (type === 'task') {
      const task = await this.prisma.task.findUnique({
        where: { id },
      });
      if (!task) throw new NotFoundException('Task not found');

      // Check permission: Project Manager, Creator, the person who deleted it, or ADMIN
      if (!isSysAdmin && task.deletedById !== userId) {
        const isCreator = task.creatorId === userId;
        const projectMember = await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: task.projectId, userId } },
        });
        const isManager = projectMember?.role === ProjectRole.MANAGER;

        if (!isCreator && !isManager) {
          throw new ForbiddenException('Only project managers, creator, the person who deleted it, or ADMIN can permanently delete it');
        }
      }

      await this.prisma.task.delete({ where: { id } });
      return { message: 'Task permanently deleted successfully' };
    }

    throw new BadRequestException(`Invalid type: ${type}`);
  }
}
