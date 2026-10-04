import { describe, it, expect } from 'vitest';
import { CreateSkillSchema, UpdateSkillSchema, getSkillTier, SkillTier } from './skill.contract';
import { CreateTaskSchema } from '../tasks/task.contract';

describe('Skill Contracts', () => {
  describe('CreateSkillSchema', () => {
    it('trims names and accepts optional hex colors', () => {
      const result = CreateSkillSchema.safeParse({ name: '  Math  ', color: '#10b981' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe('Math');
    });

    it('rejects empty names, overlong names, and invalid colors', () => {
      expect(CreateSkillSchema.safeParse({ name: '   ' }).success).toBe(false);
      expect(CreateSkillSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
      expect(CreateSkillSchema.safeParse({ name: 'Math', color: 'red' }).success).toBe(false);
    });

    it('UpdateSkillSchema allows partial updates', () => {
      expect(UpdateSkillSchema.safeParse({ color: '#ef4444' }).success).toBe(true);
      expect(UpdateSkillSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('Task skillIds', () => {
    it('accepts UUID skill ids and rejects non-UUIDs or more than 10', () => {
      const id = '0b7f3c1e-8a2d-4f6b-9c3e-1a2b3c4d5e6f';
      expect(CreateTaskSchema.safeParse({ title: 'Read', skillIds: [id] }).success).toBe(true);
      expect(CreateTaskSchema.safeParse({ title: 'Read', skillIds: ['nope'] }).success).toBe(false);
      expect(
        CreateTaskSchema.safeParse({ title: 'Read', skillIds: Array(11).fill(id) }).success,
      ).toBe(false);
    });
  });

  describe('getSkillTier', () => {
    it('maps counts to tier bands', () => {
      expect(getSkillTier(0).tier).toBe(SkillTier.NOVICE);
      expect(getSkillTier(5).tier).toBe(SkillTier.NOVICE);
      expect(getSkillTier(6).tier).toBe(SkillTier.PRACTITIONER);
      expect(getSkillTier(20).tier).toBe(SkillTier.PRACTITIONER);
      expect(getSkillTier(21).tier).toBe(SkillTier.PROFICIENT);
      expect(getSkillTier(50).tier).toBe(SkillTier.PROFICIENT);
      expect(getSkillTier(51).tier).toBe(SkillTier.MASTER);
    });

    it('reports next threshold and progress within the band', () => {
      expect(getSkillTier(0)).toEqual({ tier: SkillTier.NOVICE, nextTierAt: 6, progress: 0 });
      expect(getSkillTier(13).nextTierAt).toBe(21);
      expect(getSkillTier(13).progress).toBeCloseTo(7 / 15);
      expect(getSkillTier(200)).toEqual({ tier: SkillTier.MASTER, nextTierAt: null, progress: 1 });
    });

    it('clamps negative input', () => {
      expect(getSkillTier(-3).tier).toBe(SkillTier.NOVICE);
    });
  });
});
