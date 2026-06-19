import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users
   * List all users – ADMIN only, supports ?role=&isActive=&search=
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  /**
   * GET /users/stats
   * Admin dashboard stats – ADMIN only
   */
  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.usersService.getStats();
  }

  /**
   * GET /users/:id
   * Get user by ID – ADMIN or the user themselves
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    if (currentUser.role !== Role.ADMIN && currentUser.userId !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id
   * Update user profile – ADMIN or the user themselves
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; email?: string; avatar?: string; password?: string },
    @CurrentUser() currentUser: any,
  ) {
    if (currentUser.role !== Role.ADMIN && currentUser.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, body);
  }

  /**
   * PATCH /users/:id/role
   * Change user system role – ADMIN only
   */
  @Patch(':id/role')
  @Roles(Role.ADMIN)
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: Role,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.changeRole(id, role, currentUser.userId);
  }

  /**
   * DELETE /users/:id
   * Soft-delete (deactivate) user – ADMIN only
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.deactivate(id, currentUser.userId);
  }

  /**
   * PATCH /users/:id/activate
   * Reactivate a user – ADMIN only
   */
  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.activate(id);
  }
}
