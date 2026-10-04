import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, TokensModule, TasksModule],
})
export class AppModule {}
