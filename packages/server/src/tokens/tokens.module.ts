import { Module } from '@nestjs/common';
import { ApiTokensRepository } from './api-tokens.repository';
import { ApiTokensService } from './api-tokens.service';
import { ApiTokensController } from './api-tokens.controller';

@Module({
  controllers: [ApiTokensController],
  providers: [ApiTokensRepository, ApiTokensService],
  exports: [ApiTokensService, ApiTokensRepository],
})
export class TokensModule {}
