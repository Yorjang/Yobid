import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, WorkspaceRole } from '@prisma/client';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * POST /workspaces
   * Create a new workspace – ADMIN or PROJECT_MANAGER
   */
  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  create(
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.create(body, user.userId);
  }

  /**
   * GET /workspaces
   * List workspaces the user has access to
   */
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workspacesService.findAll(user.userId, user.role);
  }

  /**
   * GET /workspaces/:id
   * Get workspace details (must be a member or ADMIN)
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.workspacesService.findOne(id, user.userId, user.role);
  }

  /**
   * PATCH /workspaces/:id
   * Update workspace – owner or ADMIN
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.update(id, body, user.userId, user.role);
  }

  /**
   * DELETE /workspaces/:id
   * Soft-delete workspace – owner or ADMIN
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.workspacesService.remove(id, user.userId, user.role);
  }

  /**
   * POST /workspaces/:id/members
   * Add a member to the workspace
   */
  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number; role?: WorkspaceRole },
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.addMember(
      id,
      body.userId,
      body.role,
      user.userId,
      user.role,
    );
  }

  /**
   * DELETE /workspaces/:id/members/:userId
   * Remove a member from the workspace
   */
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.removeMember(id, userId, user.userId, user.role);
  }
}
