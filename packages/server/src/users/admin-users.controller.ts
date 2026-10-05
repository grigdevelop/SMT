import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Inject } from '@nestjs/common';
import {
  Role,
  UpdateUserRoleSchema,
  type UpdateUserRoleDto,
  type AdminUserListItemDto,
  type UserDto,
} from '@self/contracts';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(@Inject(AdminUsersService) private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async findAll(): Promise<AdminUserListItemDto[]> {
    return this.adminUsersService.findAll();
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') targetUserId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateUserRoleSchema)) dto: UpdateUserRoleDto,
  ): Promise<UserDto> {
    return this.adminUsersService.updateRole(targetUserId, currentUser.id, dto.role);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') targetUserId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ success: boolean; deletedUserId: string }> {
    return this.adminUsersService.deleteUser(targetUserId, currentUser.id);
  }
}
