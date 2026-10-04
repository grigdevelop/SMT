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
  Headers,
} from '@nestjs/common';
import { CreateTaskSchema, UpdateTaskSchema } from '@self/contracts';
import type { CreateTaskDto, UpdateTaskDto, TaskDto } from '@self/contracts';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<TaskDto[]> {
    return this.tasksService.findAll(user.id);
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TaskDto> {
    return this.tasksService.findById(id, user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateTaskSchema)) dto: CreateTaskDto,
    @Headers('x-simulated-date') simulatedDate?: string,
  ): Promise<TaskDto> {
    return this.tasksService.create(user.id, dto, simulatedDate);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema)) dto: UpdateTaskDto,
    @Headers('x-simulated-date') simulatedDate?: string,
  ): Promise<TaskDto> {
    return this.tasksService.update(id, user.id, dto, simulatedDate);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.tasksService.delete(id, user.id);
  }
}
