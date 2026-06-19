import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Create a notification (internal use) */
  async create(data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type ?? 'INFO',
        link: data.link,
      },
    });
  }

  /** Get all notifications for the current user */
  async findAll(userId: number, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** Count unread notifications */
  async countUnread(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /** Mark a single notification as read */
  async markRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    if (notification.userId !== userId) {
      throw new ForbiddenException('This notification does not belong to you');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /** Mark all notifications as read for the user */
  async markAllRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  /** Delete a single notification */
  async remove(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    if (notification.userId !== userId) {
      throw new ForbiddenException('This notification does not belong to you');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  /** Delete all read notifications for the user */
  async clearRead(userId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { deleted: result.count };
  }
}
