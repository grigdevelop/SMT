import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type { AdminUserListItemDto, UserDto, Role } from '@self/contracts';

@Injectable()
export class AdminUsersService {
  constructor(@Inject(UsersRepository) private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<AdminUserListItemDto[]> {
    const users = await this.usersRepository.findAllWithStats();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role as Role,
      taskCount: Number(u.task_count || 0),
      skillCount: Number(u.skill_count || 0),
      createdAt: new Date(u.created_at).toISOString(),
      updatedAt: new Date(u.updated_at).toISOString(),
    }));
  }

  async updateRole(targetUserId: string, currentUserId: string, role: Role): Promise<UserDto> {
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Cannot modify your own administrator role');
    }

    const updated = await this.usersRepository.updateRole(targetUserId, role);
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role as Role,
      createdAt: new Date(updated.created_at).toISOString(),
      updatedAt: new Date(updated.updated_at).toISOString(),
    };
  }

  async deleteUser(
    targetUserId: string,
    currentUserId: string,
  ): Promise<{ success: boolean; deletedUserId: string }> {
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Cannot delete your own administrator account');
    }

    const deleted = await this.usersRepository.delete(targetUserId);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }

    return { success: true, deletedUserId: targetUserId };
  }
}
