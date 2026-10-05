import { Injectable, OnApplicationBootstrap, Logger, Inject } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from './password.service';
import { Role } from '@self/contracts';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const hasAdmin = await this.usersRepository.hasAdmin();
      if (hasAdmin) {
        return;
      }

      const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@self.local').toLowerCase().trim();
      const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin12345!';

      const existingUser = await this.usersRepository.findByEmail(email);
      if (existingUser) {
        this.logger.log(`Promoting existing user "${email}" to default ADMIN`);
        await this.usersRepository.updateRole(existingUser.id, Role.ADMIN);
        return;
      }

      this.logger.log(`No admin account found. Bootstrapping default administrator "${email}"...`);
      const passwordHash = await this.passwordService.hash(password);
      await this.usersRepository.create({
        email,
        password_hash: passwordHash,
        role: Role.ADMIN,
      });
      this.logger.log(`Default administrator "${email}" created successfully.`);
    } catch (err: unknown) {
      this.logger.error('Failed to bootstrap default admin user:', err);
    }
  }
}
