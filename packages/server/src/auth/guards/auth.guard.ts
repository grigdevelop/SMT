import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'node:crypto';
import type { Role } from '@self/contracts';
import { KyselyService } from '../../database/kysely.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(KyselyService) private readonly kysely: KyselyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Invalid Authorization header format. Expected "Bearer <token>"',
      );
    }

    // Path A: Personal API Token (smt_pat_*)
    if (token.startsWith('smt_pat_')) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const tokenRecord = await this.kysely.db
        .selectFrom('api_tokens')
        .innerJoin('users', 'users.id', 'api_tokens.user_id')
        .select([
          'users.id as user_id',
          'users.email as user_email',
          'users.role as user_role',
          'api_tokens.id as token_id',
        ])
        .where('api_tokens.token_hash', '=', tokenHash)
        .executeTakeFirst();

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid or revoked API token');
      }

      // Asynchronously update last_used_at without blocking the request
      this.kysely.db
        .updateTable('api_tokens')
        .set({ last_used_at: new Date().toISOString() })
        .where('id', '=', tokenRecord.token_id)
        .execute()
        .catch(() => {});

      request.user = {
        id: tokenRecord.user_id,
        email: tokenRecord.user_email,
        role: tokenRecord.user_role as Role,
      };

      return true;
    }

    // Path B: Interactive Session JWT
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as Role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
