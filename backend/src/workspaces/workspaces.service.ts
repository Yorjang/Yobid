import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  /** Generate a URL-safe slug from name */
  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now().toString(36)
    );
  }

  /** Create a new workspace (ADMIN or PROJECT_MANAGER) */
  async create(
    data: { name: string; description?: string },
    ownerId: number,
  ) {
    const slug = this.generateSlug(data.name);

    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        description: data.description,
        slug,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true, projects: true } },
      },
    });

    return workspace;
  }

  /** List all workspaces visible to the user */
  async findAll(userId: number, userRole: Role) {
    // ADMIN sees everything
    if (userRole === Role.ADMIN) {
      return this.prisma.workspace.findMany({
        where: { isActive: true, isDeleted: false },
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { members: true, projects: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Others see only workspaces they are a member of
    return this.prisma.workspace.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        members: { some: { userId } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single workspace by ID */
  async findOne(id: number, userId: number, userRole: Role) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
        projects: {
          where: { isActive: true, isDeleted: false },
          select: { id: true, name: true, description: true, createdAt: true },
        },
      },
    });

    if (!workspace || !workspace.isActive || workspace.isDeleted) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    this.assertAccess(workspace, userId, userRole);
    return workspace;
  }

  /** Update workspace details (owner or ADMIN) */
  async update(
    id: number,
    data: { name?: string; description?: string },
    userId: number,
    userRole: Role,
  ) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace || !workspace.isActive || workspace.isDeleted) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    if (userRole !== Role.ADMIN && workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner or ADMIN can update it');
    }

    return this.prisma.workspace.update({
      where: { id },
      data: { ...data },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /** Soft-delete workspace (owner or ADMIN) */
  async remove(id: number, userId: number, userRole: Role) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace || !workspace.isActive || workspace.isDeleted) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    if (userRole !== Role.ADMIN && workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner or ADMIN can delete it');
    }

    return this.prisma.workspace.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: new Date() },
      select: { id: true, name: true, isActive: true, isDeleted: true },
    });
  }

  /** Add a member to the workspace */
  async addMember(
    workspaceId: number,
    targetUserIdOrEmail: number | string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
    requesterId: number,
    requesterRole: Role,
  ) {
    if (targetUserIdOrEmail === undefined || targetUserIdOrEmail === null) {
      throw new BadRequestException('userId or email is required');
    }
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || !workspace.isActive || workspace.isDeleted) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    if (requesterRole !== Role.ADMIN && workspace.ownerId !== requesterId) {
      // Check if requester is at least a MANAGER in the workspace
      const requesterMembership = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: requesterId } },
      });
      if (
        !requesterMembership ||
        requesterMembership.role === WorkspaceRole.MEMBER
      ) {
        throw new ForbiddenException('Only workspace owners/managers or ADMIN can add members');
      }
    }

    // Check if target user exists
    let targetUser;
    if (typeof targetUserIdOrEmail === 'number') {
      targetUser = await this.prisma.user.findUnique({ where: { id: targetUserIdOrEmail } });
    } else {
      targetUser = await this.prisma.user.findUnique({ where: { email: targetUserIdOrEmail } });
    }
    if (!targetUser) {
      throw new NotFoundException(`User with ID/email "${targetUserIdOrEmail}" not found`);
    }

    // Check for duplicate membership
    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
    });
    if (existing) throw new ConflictException('User is already a member of this workspace');

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId: targetUser.id, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  /** Remove a member from the workspace */
  async removeMember(
    workspaceId: number,
    targetUserId: number,
    requesterId: number,
    requesterRole: Role,
  ) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || !workspace.isActive || workspace.isDeleted) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    // Owner cannot be removed
    if (workspace.ownerId === targetUserId) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    if (requesterRole !== Role.ADMIN && workspace.ownerId !== requesterId) {
      // Allow members to leave by themselves
      if (requesterId !== targetUserId) {
        throw new ForbiddenException('Only the workspace owner or ADMIN can remove members');
      }
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Membership not found');

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    return { message: 'Member removed successfully' };
  }

  /** Check if user is a member; throw ForbiddenException if not */
  private assertAccess(workspace: any, userId: number, userRole: Role) {
    if (userRole === Role.ADMIN) return;
    const isMember = workspace.members?.some((m: any) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
  }
}
