import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateApiTokenSchema } from '@self/contracts';
import type { CreateApiTokenDto, ApiTokenDto, CreatedApiTokenDto } from '@self/contracts';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTokensService } from './api-tokens.service';

@Controller('tokens')
@UseGuards(AuthGuard)
export class ApiTokensController {
  constructor(private readonly tokensService: ApiTokensService) {}

  @Post()
  async generateToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateApiTokenSchema)) dto: CreateApiTokenDto,
  ): Promise<CreatedApiTokenDto> {
    return this.tokensService.generateToken(user.id, dto);
  }

  @Get()
  async listTokens(@CurrentUser() user: AuthenticatedUser): Promise<ApiTokenDto[]> {
    return this.tokensService.listTokens(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tokensService.revokeToken(id, user.id);
  }
}
