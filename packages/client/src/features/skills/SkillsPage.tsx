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

  const getTierBadgeStyle = (tier: SkillTier) => {
    switch (tier) {
      case SkillTier.MASTER:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case SkillTier.PROFICIENT:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case SkillTier.PRACTITIONER:
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case SkillTier.NOVICE:
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading skills...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm max-w-xl mx-auto">
        Failed to load skills.
      </div>
    );
  }

  return (
    <div ref={pageRef} className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Skills & Capability Progression
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Zero-drift mastery: tasks complete into capability investment without RPG clutter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>
                <strong>{skills.length}</strong> Skills
              </span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                <strong>{totalMastery}</strong> Completed
              </span>
            </div>
          </div>

          {!isCreating && (
            <button
              type="button"
              onClick={handleStartCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] motion-reduce:transform-none text-white rounded-lg text-xs font-semibold shadow-2xs transition-all duration-75 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Skill</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Create Skill Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 rounded-xl border border-indigo-200 bg-white shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Create New Skill
            </span>
            <button
              type="button"
              onClick={handleCancelCreate}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name (e.g. Mathematics, TypeScript, Writing)..."
              autoFocus
              maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-base sm:text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {createError && <p className="text-2xs text-rose-600 font-medium">{createError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelCreate}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-[0.98] motion-reduce:transform-none text-xs text-slate-600 font-medium transition-all duration-75 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newSkillName.trim() || createSkill.isPending}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] motion-reduce:transform-none disabled:opacity-50 text-xs text-white font-semibold shadow-2xs transition-all duration-75 cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Skill</span>
            </button>
          </div>
        </form>
      )}

      {/* Skills Grid */}
      {skills.length === 0 && !isCreating ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl space-y-3 bg-white/50">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-medium text-slate-600">No skills cultivated yet</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Skills transform your daily checklists into long-term capability growth. Add your first
            skill to start tracking progress.
          </p>
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Skill
          </button>
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
                  className="p-4 rounded-xl border border-indigo-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Edit Skill</span>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-base sm:text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                            ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                            : 'hover:opacity-80'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {editError && <p className="text-2xs text-rose-600 font-medium">{editError}</p>}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-600 active:scale-[0.98] motion-reduce:transform-none transition-all duration-75 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!editName.trim() || updateSkill.isPending}
                      className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium active:scale-[0.98] motion-reduce:transform-none transition-all duration-75 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={skill.id}
                data-testid={`skill-card-${skill.name.toLowerCase()}`}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition space-y-3 group"
              >
                {/* Card Top: Skill Name & Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: skill.color }}
                    />
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{skill.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Tier Badge */}
                    <span
                      className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${getTierBadgeStyle(
                        tierProgress.tier,
                      )}`}
                    >
                      {tierProgress.tier}
                    </span>

                    {/* Action buttons */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(skill)}
                      aria-label={`Edit ${skill.name}`}
                      className="text-slate-400 hover:text-indigo-600 active:scale-90 motion-reduce:transform-none sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1.5 rounded transition-all duration-75 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(skill.id, skill.name)}
                      aria-label={`Delete ${skill.name}`}
                      className="text-slate-400 hover:text-rose-600 active:scale-90 motion-reduce:transform-none sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1.5 rounded transition-all duration-75 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Middle: Completed Tasks Counter */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900">
                    {skill.completedTaskCount}
                  </span>
                  <span className="text-xs text-slate-500">
                    {skill.completedTaskCount === 1 ? 'task completed' : 'tasks completed'}
                  </span>
                </div>

                {/* Card Bottom: Tier Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-2xs text-slate-500">
                    <span>
                      {tierProgress.nextTierAt
                        ? `${tierProgress.nextTierAt - skill.completedTaskCount} more to next tier`
                        : 'Mastery achieved (Top tier)'}
                    </span>
                    <span>{Math.round(tierProgress.progress * 100)}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
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
