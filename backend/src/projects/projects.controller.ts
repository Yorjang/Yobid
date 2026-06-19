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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, ProjectRole } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * POST /projects
   * Create a project – PROJECT_MANAGER or ADMIN
   */
  @Post()
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      workspaceId: number;
      startDate?: string;
      endDate?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.projectsService.create(body, user.userId, user.role);
  }

  /**
   * GET /projects?workspaceId=
   * List projects in a workspace
   */
  @Get()
  findAll(
    @Query('workspaceId', ParseIntPipe) workspaceId: number,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.findAll(workspaceId, user.userId, user.role);
  }

  /**
   * GET /projects/:id
   * Get project details
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user.userId, user.role);
  }

  /**
   * GET /projects/:id/stats
   * Get project statistics
   */
  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.projectsService.getStats(id, user.userId, user.role);
  }

  /**
   * PATCH /projects/:id
   * Update project – project MANAGER or ADMIN
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; startDate?: string; endDate?: string },
    @CurrentUser() user: any,
  ) {
    return this.projectsService.update(id, body, user.userId, user.role);
  }

  /**
   * DELETE /projects/:id
   * Soft-delete project – project MANAGER or ADMIN
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.projectsService.remove(id, user.userId, user.role);
  }

  /**
   * POST /projects/:id/members
   * Add member to project
   */
  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number; role?: ProjectRole },
    @CurrentUser() user: any,
  ) {
    return this.projectsService.addMember(
      id,
      body.userId,
      body.role,
      user.userId,
      user.role,
    );
  }

  /**
   * DELETE /projects/:id/members/:userId
   * Remove member from project
   */
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.removeMember(id, userId, user.userId, user.role);
  }
}
