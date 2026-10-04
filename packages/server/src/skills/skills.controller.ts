import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateSkillSchema, UpdateSkillSchema } from '@self/contracts';
import type { CreateSkillDto, UpdateSkillDto, SkillDto } from '@self/contracts';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkillsService } from './skills.service';

@Controller('skills')
@UseGuards(AuthGuard)
export class SkillsController {
  constructor(@Inject(SkillsService) private readonly skillsService: SkillsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<SkillDto[]> {
    return this.skillsService.findAll(user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateSkillSchema)) dto: CreateSkillDto,
  ): Promise<SkillDto> {
    return this.skillsService.create(user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateSkillSchema)) dto: UpdateSkillDto,
  ): Promise<SkillDto> {
    return this.skillsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.skillsService.delete(id, user.id);
  }
}
