import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import crypto from 'node:crypto';
import type { CreateApiTokenDto, ApiTokenDto, CreatedApiTokenDto } from '@self/contracts';
import { Selectable } from 'kysely';
import { ApiTokenTable } from '../database/types';
import { ApiTokensRepository } from './api-tokens.repository';

@Injectable()
export class ApiTokensService {
  constructor(@Inject(ApiTokensRepository) private readonly repository: ApiTokensRepository) {}

  async generateToken(userId: string, dto: CreateApiTokenDto): Promise<CreatedApiTokenDto> {
    const rawEntropy = crypto.randomBytes(32).toString('hex');
    const rawToken = `smt_pat_${rawEntropy}`;
    const tokenPreview = `smt_pat_${rawEntropy.slice(0, 4)}...${rawEntropy.slice(-4)}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await this.repository.create({
      user_id: userId,
      name: dto.name,
      token_hash: tokenHash,
      token_preview: tokenPreview,
    });

    return {
      ...this.toDto(record),
      rawToken, // Presented to the user strictly once upon creation
    };
  }

  async listTokens(userId: string): Promise<ApiTokenDto[]> {
    const records = await this.repository.findByUserId(userId);
    return records.map((record) => this.toDto(record));
  }

  async revokeToken(id: string, userId: string): Promise<void> {
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundException(`API Token with ID "${id}" not found`);
    }
  }

  private toDto(record: Selectable<ApiTokenTable>): ApiTokenDto {
    return {
      id: record.id,
      name: record.name,
      tokenPreview: record.token_preview,
      lastUsedAt: record.last_used_at ? new Date(record.last_used_at).toISOString() : null,
      createdAt: new Date(record.created_at).toISOString(),
    };
  }
}
