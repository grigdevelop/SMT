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
} from '@nestjs/common';
import { CreateTaskSchema, UpdateTaskSchema } from '@self/contracts';
import type { CreateTaskDto, UpdateTaskDto, TaskDto } from '@self/contracts';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(): Promise<TaskDto[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<TaskDto> {
    return this.tasksService.findById(id);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateTaskSchema)) dto: CreateTaskDto,
  ): Promise<TaskDto> {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema)) dto: UpdateTaskDto,
  ): Promise<TaskDto> {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.tasksService.delete(id);
  }
}
