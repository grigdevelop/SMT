import React, { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from './use-skills';
import {
  getSkillTier,
  SkillTier,
  SKILL_COLOR_PALETTE,
  DEFAULT_SKILL_COLOR,
  type SkillDto,
} from '@self/contracts';
import { Button, Badge, Input } from '../../components/ui';
import {
  Sparkles,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export function SkillsPage() {
  const [pageRef] = useAutoAnimate<HTMLDivElement>({ duration: 150 });
  const [gridRef] = useAutoAnimate<HTMLDivElement>({ duration: 150 });
  const { data: skills = [], isLoading, error } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [isCreating, setIsCreating] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillColor, setNewSkillColor] = useState(DEFAULT_SKILL_COLOR);
  const [createError, setCreateError] = useState('');

  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editError, setEditError] = useState('');

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewSkillName('');
    const nextColor =
      SKILL_COLOR_PALETTE[skills.length % SKILL_COLOR_PALETTE.length] || DEFAULT_SKILL_COLOR;
    setNewSkillColor(nextColor);
    setCreateError('');
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewSkillName('');
    setCreateError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    createSkill.mutate(
      { name: trimmed, color: newSkillColor },
      {
        onSuccess: () => {
          setIsCreating(false);
          setNewSkillName('');
          setCreateError('');
        },
        onError: (err: Error) => {
          setCreateError(err.message || 'Failed to create skill');
        },
      },
    );
  };

  const handleStartEdit = (skill: SkillDto) => {
    setEditingSkillId(skill.id);
    setEditName(skill.name);
    setEditColor(skill.color);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingSkillId(null);
    setEditError('');
  };

  const handleEditSubmit = (skillId: string, e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;

    updateSkill.mutate(
      { id: skillId, dto: { name: trimmed, color: editColor } },
      {
        onSuccess: () => {
          setEditingSkillId(null);
          setEditError('');
        },
        onError: (err: Error) => {
          setEditError(err.message || 'Failed to update skill');
        },
      },
    );
  };

  const handleDelete = (skillId: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${name}" skill? Associated tasks will remain.`,
      )
    ) {
      deleteSkill.mutate(skillId);
    }
  };

  const totalMastery = skills.reduce((sum, s) => sum + s.completedTaskCount, 0);

  const getTierBadgeVariant = (tier: SkillTier) => {
    switch (tier) {
      case SkillTier.MASTER:
        return 'purple' as const;
      case SkillTier.PROFICIENT:
        return 'primary' as const;
      case SkillTier.PRACTITIONER:
        return 'sky' as const;
      case SkillTier.NOVICE:
      default:
        return 'default' as const;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-base-content/60">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        <span>Loading skills...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 border border-error/20 text-error rounded-lg text-sm max-w-xl mx-auto">
        Failed to load skills.
      </div>
    );
  }

  return (
    <div ref={pageRef} className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-base-300">
        <div>
          <h2 className="text-xl font-bold text-base-content tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Skills & Capability Progression
          </h2>
          <p className="text-xs text-base-content/70 mt-1">
            Zero-drift mastery: tasks complete into capability investment without RPG clutter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-base-content/70 bg-base-100 border border-base-300 px-3 py-1.5 rounded-lg shadow-xs">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-base-content/60" />
              <span>
                <strong className="text-base-content">{skills.length}</strong> Skills
              </span>
            </div>
            <div className="h-3 w-px bg-base-300" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>
                <strong className="text-base-content">{totalMastery}</strong> Completed
              </span>
            </div>
          </div>

          {!isCreating && (
            <Button onClick={handleStartCreate} size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>New Skill</span>
            </Button>
          )}
        </div>
      </div>

      {/* Inline Create Skill Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="card bg-base-100 p-4 border border-primary/30 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-base-content flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary" />
              Create New Skill
            </span>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={handleCancelCreate}
              className="text-base-content/60 hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name (e.g. Mathematics, TypeScript, Writing)..."
              autoFocus
              maxLength={100}
              className="flex-1"
            />

            {/* Color Palette Picker */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              {SKILL_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewSkillColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform active:scale-90 motion-reduce:transform-none cursor-pointer shrink-0 ${
                    newSkillColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {createError && <p className="text-2xs text-error font-medium">{createError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleCancelCreate}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newSkillName.trim() || createSkill.isPending}
              className="gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Skill</span>
            </Button>
          </div>
        </form>
      )}

      {/* Skills Grid */}
      {skills.length === 0 && !isCreating ? (
        <div className="text-center py-16 border-2 border-dashed border-base-300 rounded-xl space-y-3 bg-base-100/50">
          <Award className="w-10 h-10 text-base-content/40 mx-auto" />
          <div className="text-sm font-medium text-base-content">No skills cultivated yet</div>
          <p className="text-xs text-base-content/70 max-w-sm mx-auto">
            Skills transform your daily checklists into long-term capability growth. Add your first
            skill to start tracking progress.
          </p>
          <Button type="button" onClick={handleStartCreate} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Skill
          </Button>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => {
            const isEditing = editingSkillId === skill.id;
            const tierProgress = getSkillTier(skill.completedTaskCount);

            if (isEditing) {
              return (
                <form
                  key={skill.id}
                  onSubmit={(e) => handleEditSubmit(skill.id, e)}
                  className="card bg-base-100 p-4 border border-primary/30 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-base-content">
                    <span>Edit Skill</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="iconSm"
                      onClick={handleCancelEdit}
                      className="text-base-content/60 hover:text-base-content"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                  />

                  {/* Color Palette */}
                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                    {SKILL_COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-5 h-5 rounded-full transition-transform active:scale-90 motion-reduce:transform-none cursor-pointer shrink-0 ${
                          editColor === color
                            ? 'ring-2 ring-offset-2 ring-primary scale-110'
                            : 'hover:opacity-80'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {editError && <p className="text-2xs text-error font-medium">{editError}</p>}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!editName.trim() || updateSkill.isPending}
                    >
                      Save
                    </Button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={skill.id}
                data-testid={`skill-card-${skill.name.toLowerCase()}`}
                className="card bg-base-100 p-4 border border-base-300 hover:border-base-content/30 shadow-xs transition space-y-3 group"
              >
                {/* Card Top: Skill Name & Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: skill.color }}
                    />
                    <h3 className="text-sm font-semibold text-base-content truncate">
                      {skill.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Tier Badge */}
                    <Badge variant={getTierBadgeVariant(tierProgress.tier)}>
                      {tierProgress.tier}
                    </Badge>

                    {/* Action buttons */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleStartEdit(skill)}
                      aria-label={`Edit ${skill.name}`}
                      className="text-base-content/60 hover:text-primary sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDelete(skill.id, skill.name)}
                      aria-label={`Delete ${skill.name}`}
                      className="text-base-content/60 hover:text-error sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Card Middle: Completed Tasks Counter */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-base-content">
                    {skill.completedTaskCount}
                  </span>
                  <span className="text-xs text-base-content/70">
                    {skill.completedTaskCount === 1 ? 'task completed' : 'tasks completed'}
                  </span>
                </div>

                {/* Card Bottom: Tier Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-2xs text-base-content/70">
                    <span>
                      {tierProgress.nextTierAt
                        ? `${tierProgress.nextTierAt - skill.completedTaskCount} more to next tier`
                        : 'Mastery achieved (Top tier)'}
                    </span>
                    <span>{Math.round(tierProgress.progress * 100)}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-base-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, tierProgress.progress * 100)}%`,
                        backgroundColor: skill.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
