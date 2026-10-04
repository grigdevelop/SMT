import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RegisterSchema, LoginSchema, Role } from '@self/contracts';
import type { RegisterDto, LoginDto, AuthResponseDto, UserDto } from '@self/contracts';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { AuthenticatedUser } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    return this.authService.findById(user.id);
  }

  @Get('admin/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAdminStatus(@CurrentUser() user: AuthenticatedUser) {
    return { status: 'healthy', adminEmail: user.email, role: user.role };
  }
}
