import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';

@Module({
  controllers: [AdminUsersController],
  providers: [UsersRepository, AdminUsersService],
  exports: [UsersRepository, AdminUsersService],
})
export class UsersModule {}
