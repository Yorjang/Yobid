import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications?unread=true
   * Get all notifications for the current user
   */
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.findAll(user.userId, unread === 'true');
  }

  /**
   * GET /notifications/count
   * Get unread notification count
   */
  @Get('count')
  countUnread(@CurrentUser() user: any) {
    return this.notificationsService.countUnread(user.userId);
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read
   */
  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.userId);
  }

  /**
   * DELETE /notifications/clear-read
   * Delete all read notifications
   */
  @Delete('clear-read')
  clearRead(@CurrentUser() user: any) {
    return this.notificationsService.clearRead(user.userId);
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read
   */
  @Patch(':id/read')
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markRead(id, user.userId);
  }

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.remove(id, user.userId);
  }
}
