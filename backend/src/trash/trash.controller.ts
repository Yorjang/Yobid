import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TrashService } from './trash.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('trash')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  /**
   * GET /trash
   * Get all soft-deleted workspaces, projects, tasks for the current user
   */
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.trashService.findAll(user.userId, user.role);
  }

  /**
   * POST /trash/restore/:type/:id
   * Restore a soft-deleted item
   */
  @Post('restore/:type/:id')
  restore(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.trashService.restore(type, id, user.userId, user.role);
  }

  /**
   * DELETE /trash/permanent/:type/:id
   * Permanently delete an item from the database
   */
  @Delete('permanent/:type/:id')
  permanentDelete(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.trashService.permanentDelete(type, id, user.userId, user.role);
  }
}
