import { z } from 'zod';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const CreateSkillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Skill name is required')
    .max(100, 'Skill name must be 100 characters or less'),
  color: z.string().regex(HEX_COLOR, 'Must be a valid hex color (#RRGGBB)').optional(),
});
export type CreateSkillDto = z.infer<typeof CreateSkillSchema>;

export const UpdateSkillSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  color: z.string().regex(HEX_COLOR, 'Must be a valid hex color (#RRGGBB)').optional(),
});
export type UpdateSkillDto = z.infer<typeof UpdateSkillSchema>;

/** Minimal skill projection embedded in task payloads. */
export interface SkillSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

export interface SkillDto extends SkillSummaryDto {
  /** Derived projection: number of completed tasks tagged with this skill. Never stored. */
  readonly completedTaskCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const DEFAULT_SKILL_COLOR = '#6366f1';

/** Palette used by the client to auto-assign distinct accents to new skills. */
export const SKILL_COLOR_PALETTE = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#0ea5e9', // sky
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
] as const;

export const SkillTier = {
  NOVICE: 'Novice',
  PRACTITIONER: 'Practitioner',
  PROFICIENT: 'Proficient',
  MASTER: 'Master',
} as const;
export type SkillTier = (typeof SkillTier)[keyof typeof SkillTier];

export interface SkillTierProgress {
  readonly tier: SkillTier;
  /** Completed-task count at which the next tier begins, or null at the top tier. */
  readonly nextTierAt: number | null;
  /** 0..1 progress through the current tier band. 1 at the top tier. */
  readonly progress: number;
}

const TIER_BANDS: ReadonlyArray<{ tier: SkillTier; min: number }> = [
  { tier: SkillTier.NOVICE, min: 0 },
  { tier: SkillTier.PRACTITIONER, min: 6 },
  { tier: SkillTier.PROFICIENT, min: 21 },
  { tier: SkillTier.MASTER, min: 51 },
];

/**
 * Pure projection mapping a completed-task count to a transparent mastery tier.
 * Novice: 0–5, Practitioner: 6–20, Proficient: 21–50, Master: 51+.
 */
export function getSkillTier(completedTaskCount: number): SkillTierProgress {
  const count = Math.max(0, Math.floor(completedTaskCount));
  let index = 0;
  for (let i = TIER_BANDS.length - 1; i >= 0; i--) {
    if (count >= TIER_BANDS[i].min) {
      index = i;
      break;
    }
  }

  const current = TIER_BANDS[index];
  const next = TIER_BANDS[index + 1];
  if (!next) {
    return { tier: current.tier, nextTierAt: null, progress: 1 };
  }

  return {
    tier: current.tier,
    nextTierAt: next.min,
    progress: (count - current.min) / (next.min - current.min),
  };
}
