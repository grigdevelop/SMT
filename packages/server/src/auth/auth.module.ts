import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { PasswordService } from './password.service';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthController } from './auth.controller';

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_123',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [PasswordService, AuthService, AuthGuard],
  exports: [PasswordService, AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
