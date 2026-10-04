import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import type { CreateSkillDto, UpdateSkillDto, SkillDto } from '@self/contracts';
import { SkillsRepository, SkillRowWithCount } from './skills.repository';

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

@Injectable()
export class SkillsService {
  constructor(@Inject(SkillsRepository) private readonly repository: SkillsRepository) {}

  async findAll(userId: string): Promise<SkillDto[]> {
    const rows = await this.repository.findAllWithCounts(userId);
    return rows.map((r) => this.toDto(r));
  }

  async create(userId: string, dto: CreateSkillDto): Promise<SkillDto> {
    try {
      const row = await this.repository.create(userId, { name: dto.name, color: dto.color });
      return this.toDto({ ...row, completed_task_count: 0 });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Skill "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async update(id: string, userId: string, dto: UpdateSkillDto): Promise<SkillDto> {
    try {
      const updated = await this.repository.update(id, userId, dto);
      if (!updated) throw new NotFoundException(`Skill with ID "${id}" not found`);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Skill "${dto.name}" already exists`);
      }
      throw err;
    }
    const row = await this.repository.findByIdWithCount(id, userId);
    if (!row) throw new NotFoundException(`Skill with ID "${id}" not found`);
    return this.toDto(row);
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) throw new NotFoundException(`Skill with ID "${id}" not found`);
  }

  private toDto(row: SkillRowWithCount): SkillDto {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      completedTaskCount: row.completed_task_count,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
