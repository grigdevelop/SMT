import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsRepository } from './skills.repository';
import { SkillsService } from './skills.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillsRepository, SkillsService],
  exports: [SkillsRepository, SkillsService],
})
export class SkillsModule {}
