import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { RegisterDto, LoginDto, AuthResponseDto, UserDto, Role } from '@self/contracts';
import { Selectable } from 'kysely';
import { UserTable } from '../database/types';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersRepository.create({
      email: dto.email,
      password_hash: passwordHash,
      role: dto.role,
    });

    const accessToken = await this.generateToken(user);
    return {
      accessToken,
      user: this.toDto(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await this.passwordService.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.generateToken(user);
    return {
      accessToken,
      user: this.toDto(user),
    };
  }

  async findById(id: string): Promise<UserDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toDto(user);
  }

  private async generateToken(user: Selectable<UserTable>): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  toDto(user: Selectable<UserTable>): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      createdAt: new Date(user.created_at).toISOString(),
      updatedAt: new Date(user.updated_at).toISOString(),
    };
  }
}
