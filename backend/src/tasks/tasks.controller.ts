import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TaskStatus, Priority } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Create a task – PROJECT_MANAGER or ADMIN
   */
  @Post()
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      projectId: number;
      assigneeId?: number;
      priority?: Priority;
      deadline?: string;
      status?: TaskStatus;
    },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.create(body, user.userId, user.role);
  }

  /**
   * GET /tasks?projectId=&status=&assigneeId=&priority=
   * List tasks in a project
   */
  @Get()
  findAll(
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: Priority,
    @CurrentUser() user?: any,
  ) {
    return this.tasksService.findAll(projectId, user.userId, user.role, {
      status,
      assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
      priority,
    });
  }

  /**
   * GET /tasks/:id
   * Get task details
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user.userId, user.role);
  }

  /**
   * PATCH /tasks/:id
   * Update task
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      title?: string;
      description?: string;
      assigneeId?: number;
      priority?: Priority;
      deadline?: string;
      status?: TaskStatus;
      position?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, body, user.userId, user.role);
  }

  /**
   * DELETE /tasks/:id
   * Delete task – PROJECT_MANAGER or ADMIN
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user.userId, user.role);
  }

  // ─── Subtasks ─────────────────────────────────────────────────────────────

  /**
   * POST /tasks/:id/subtasks
   */
  @Post(':id/subtasks')
  createSubtask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title: string; assigneeId?: number },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.createSubtask(id, body, user.userId, user.role);
  }

  /**
   * PATCH /tasks/subtasks/:subtaskId
   */
  @Patch('subtasks/:subtaskId')
  updateSubtask(
    @Param('subtaskId', ParseIntPipe) subtaskId: number,
    @Body() body: { title?: string; isCompleted?: boolean; assigneeId?: number },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateSubtask(subtaskId, body, user.userId, user.role);
  }

  /**
   * DELETE /tasks/subtasks/:subtaskId
   */
  @Delete('subtasks/:subtaskId')
  deleteSubtask(
    @Param('subtaskId', ParseIntPipe) subtaskId: number,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.deleteSubtask(subtaskId, user.userId, user.role);
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  /**
   * POST /tasks/:id/comments
   */
  @Post(':id/comments')
  createComment(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.createComment(id, content, user.userId, user.role);
  }

  /**
   * PATCH /tasks/comments/:commentId
   */
  @Patch('comments/:commentId')
  updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body('content') content: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateComment(commentId, content, user.userId, user.role);
  }

  /**
   * DELETE /tasks/comments/:commentId
   */
  @Delete('comments/:commentId')
  deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.deleteComment(commentId, user.userId, user.role);
  }
}
