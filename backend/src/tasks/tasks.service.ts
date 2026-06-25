import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TaskStatus, Priority, ProjectRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /** Assert user is a member of the project */
  private async assertProjectAccess(projectId: number, userId: number, userRole: Role) {
    if (userRole === Role.ADMIN) return;
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }

  /** Assert user is a project manager */
  private async assertProjectManager(projectId: number, userId: number, userRole: Role) {
    if (userRole === Role.ADMIN) return;
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member || member.role !== ProjectRole.MANAGER) {
      throw new ForbiddenException('Only project managers or ADMIN can perform this action');
    }
  }

  /** Create a task */
  async create(
    data: {
      title: string;
      description?: string;
      projectId: number;
      assigneeId?: number;
      priority?: Priority;
      deadline?: string;
      status?: TaskStatus;
    },
    userId: number,
    userRole: Role,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId, isDeleted: false, workspace: { isDeleted: false } },
    });
    if (!project) throw new NotFoundException(`Project ${data.projectId} not found`);

    await this.assertProjectManager(data.projectId, userId, userRole);

    // Get max position for the status column
    const maxPos = await this.prisma.task.aggregate({
      where: { projectId: data.projectId, status: data.status ?? TaskStatus.TODO, isDeleted: false },
      _max: { position: true },
    });

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        priority: data.priority ?? Priority.MEDIUM,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: data.status ?? TaskStatus.TODO,
        creatorId: userId,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    // Notify assignee
    if (data.assigneeId && data.assigneeId !== userId) {
      await this.notificationsService.create({
        userId: data.assigneeId,
        title: 'New Task Assigned',
        message: `You have been assigned to task: "${task.title}"`,
        type: 'INFO',
        link: `/projects/${data.projectId}/tasks/${task.id}`,
      });
    }

    return task;
  }

  /** List tasks in a project, optionally filtered by status */
  async findAll(
    projectId: number,
    userId: number,
    userRole: Role,
    filters?: { status?: TaskStatus; assigneeId?: number; priority?: Priority },
  ) {
    await this.assertProjectAccess(projectId, userId, userRole);

    const where: any = { projectId, isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.priority) where.priority = filters.priority;

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  }

  /** Get a single task with full details */
  async findOne(id: number, userId: number, userRole: Role) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, isDeleted: true, workspace: { select: { id: true, name: true, isDeleted: true } } } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task || task.isDeleted || task.project.isDeleted || task.project.workspace.isDeleted) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    await this.assertProjectAccess(task.projectId, userId, userRole);

    return task;
  }

  /** Update task (PROJECT_MANAGER can update everything, assignee can update status) */
  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      assigneeId?: number;
      priority?: Priority;
      deadline?: string;
      status?: TaskStatus;
      position?: number;
    },
    userId: number,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { isDeleted: true, workspace: { select: { isDeleted: true } } } } }
    });
    if (!task || task.isDeleted || task.project.isDeleted || task.project.workspace.isDeleted) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    // Check if user is a project manager
    const isManager =
      userRole === Role.ADMIN ||
      (await this.prisma.projectMember
        .findUnique({
          where: { projectId_userId: { projectId: task.projectId, userId } },
        })
        .then((m) => m?.role === ProjectRole.MANAGER));

    const isAssignee = task.assigneeId === userId;

    if (!isManager && !isAssignee) {
      throw new ForbiddenException('Only the task assignee or project manager can update this task');
    }

    // MEMBERs (assignees) can only update status
    if (!isManager && isAssignee) {
      const allowedKeys = new Set(['status']);
      const hasDisallowedKeys = Object.keys(data).some((k) => !allowedKeys.has(k));
      if (hasDisallowedKeys) {
        throw new ForbiddenException('Members can only update the task status');
      }
    }

    const oldAssigneeId = task.assigneeId;

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    // Notify new assignee if changed
    if (data.assigneeId && data.assigneeId !== oldAssigneeId && data.assigneeId !== userId) {
      await this.notificationsService.create({
        userId: data.assigneeId,
        title: 'Task Assigned to You',
        message: `You have been assigned to task: "${updated.title}"`,
        type: 'INFO',
        link: `/projects/${task.projectId}/tasks/${id}`,
      });
    }

    return updated;
  }

  /** Delete a task */
  async remove(id: number, userId: number, userRole: Role) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { isDeleted: true, workspace: { select: { isDeleted: true } } } } }
    });
    if (!task || task.isDeleted || task.project.isDeleted || task.project.workspace.isDeleted) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    await this.assertProjectAccess(task.projectId, userId, userRole);

    await this.prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
    return { message: 'Task deleted successfully' };
  }

  // ─── Subtasks ─────────────────────────────────────────────────────────────

  async createSubtask(
    taskId: number,
    data: { title: string; assigneeId?: number },
    userId: number,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    await this.assertProjectManager(task.projectId, userId, userRole);

    return this.prisma.subtask.create({
      data: { taskId, title: data.title, assigneeId: data.assigneeId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async updateSubtask(
    subtaskId: number,
    data: { title?: string; isCompleted?: boolean; assigneeId?: number },
    userId: number,
    userRole: Role,
  ) {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });
    if (!subtask) throw new NotFoundException(`Subtask ${subtaskId} not found`);

    await this.assertProjectAccess(subtask.task.projectId, userId, userRole);

    return this.prisma.subtask.update({
      where: { id: subtaskId },
      data,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async deleteSubtask(subtaskId: number, userId: number, userRole: Role) {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });
    if (!subtask) throw new NotFoundException(`Subtask ${subtaskId} not found`);

    await this.assertProjectManager(subtask.task.projectId, userId, userRole);

    await this.prisma.subtask.delete({ where: { id: subtaskId } });
    return { message: 'Subtask deleted' };
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  async createComment(
    taskId: number,
    content: string,
    userId: number,
    userRole: Role,
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    await this.assertProjectAccess(task.projectId, userId, userRole);

    const comment = await this.prisma.comment.create({
      data: { taskId, content, authorId: userId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify task assignee if someone else commented
    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notificationsService.create({
        userId: task.assigneeId,
        title: 'New Comment on Your Task',
        message: `Someone commented on "${task.title}"`,
        type: 'INFO',
        link: `/projects/${task.projectId}/tasks/${taskId}`,
      });
    }

    return comment;
  }

  async updateComment(
    commentId: number,
    content: string,
    userId: number,
    userRole: Role,
  ) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    if (userRole !== Role.ADMIN && comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async deleteComment(commentId: number, userId: number, userRole: Role) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: true },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    const isManager =
      userRole === Role.ADMIN ||
      (await this.prisma.projectMember
        .findUnique({
          where: {
            projectId_userId: {
              projectId: comment.task.projectId,
              userId,
            },
          },
        })
        .then((m) => m?.role === ProjectRole.MANAGER));

    if (!isManager && comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted' };
  }
}
