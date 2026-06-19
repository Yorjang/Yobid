import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Get all users (ADMIN only) */
  async findAll(query?: { role?: Role; isActive?: boolean; search?: string }) {
    const where: any = {};

    if (query?.role) where.role = query.role;
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /** Get a user by ID */
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            workspaceMemberships: true,
            projectMemberships: true,
            assignedTasks: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /** Update user profile (ADMIN or self) */
  async update(
    id: number,
    data: { name?: string; email?: string; avatar?: string; password?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already in use');
      updateData.email = data.email;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /** Change a user's system-level role (ADMIN only) */
  async changeRole(targetId: number, role: Role, requesterId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${targetId} not found`);
    }

    // Prevent self-demotion from ADMIN
    if (targetId === requesterId && role !== Role.ADMIN) {
      throw new ForbiddenException('Admins cannot demote themselves');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  /** Soft-delete (deactivate) a user (ADMIN only) */
  async deactivate(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }

  /** Reactivate a user (ADMIN only) */
  async activate(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, email: true, isActive: true },
    });
  }

  /** Get overall system stats (ADMIN dashboard) */
  async getStats() {
    const [total, byRole, activeCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers: total,
      activeUsers: activeCount,
      inactiveUsers: total - activeCount,
      byRole: byRole.map((r) => ({ role: r.role, count: r._count._all })),
    };
  }
}
