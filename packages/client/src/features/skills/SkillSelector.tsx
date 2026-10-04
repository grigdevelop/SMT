import React, { useState, useRef, useEffect } from 'react';
import { useSkills, useCreateSkill } from './use-skills';
import { SKILL_COLOR_PALETTE, DEFAULT_SKILL_COLOR } from '@self/contracts';
import { Sparkles, X, Plus } from 'lucide-react';

export interface SkillSelectorProps {
  selectedSkillIds: string[];
  onChange: (skillIds: string[]) => void;
  maxSkills?: number;
}

export function SkillSelector({ selectedSkillIds, onChange, maxSkills = 10 }: SkillSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: skills = [], isLoading } = useSkills();
  const createSkill = useCreateSkill();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSkills = skills.filter((s) => selectedSkillIds.includes(s.id));
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSkills = skills.filter(
    (s) =>
      !selectedSkillIds.includes(s.id) &&
      (!normalizedQuery || s.name.toLowerCase().includes(normalizedQuery)),
  );

  const exactMatch = skills.some((s) => s.name.toLowerCase() === normalizedQuery);
  const canCreate = normalizedQuery.length > 0 && !exactMatch;
  const isAtLimit = selectedSkillIds.length >= maxSkills;

  const handleSelect = (skillId: string) => {
    if (isAtLimit) return;
    if (!selectedSkillIds.includes(skillId)) {
      onChange([...selectedSkillIds, skillId]);
    }
    setQuery('');
  };

  const handleRemove = (skillId: string) => {
    onChange(selectedSkillIds.filter((id) => id !== skillId));
  };

  const handleCreate = () => {
    const trimmed = query.trim();
    if (!trimmed || isAtLimit || createSkill.isPending) return;

    const nextColor =
      SKILL_COLOR_PALETTE[skills.length % SKILL_COLOR_PALETTE.length] || DEFAULT_SKILL_COLOR;

    createSkill.mutate(
      { name: trimmed, color: nextColor },
      {
        onSuccess: (newSkill) => {
          onChange([...selectedSkillIds, newSkill.id]);
          setQuery('');
          setIsOpen(false);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSkills.length > 0) {
        handleSelect(filteredSkills[0].id);
      } else if (canCreate) {
        handleCreate();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-slate-600 font-medium flex items-center gap-1 text-2xs">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Cultivated Skills (Max {maxSkills}):</span>
        </label>
        {isAtLimit && (
          <span className="text-2xs text-amber-600 font-medium">Limit of {maxSkills} reached</span>
        )}
      </div>

      {/* Selected skill chips */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[28px] p-1.5 rounded-md border border-slate-200 bg-white shadow-2xs">
        {selectedSkills.map((skill) => (
          <span
            key={skill.id}
            data-testid={`selected-skill-${skill.id}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium border"
            style={{
              backgroundColor: `${skill.color}15`,
              color: skill.color,
              borderColor: `${skill.color}35`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: skill.color }}
            />
            <span>{skill.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(skill.id)}
              aria-label={`Remove skill ${skill.name}`}
              className="p-1 -m-1 inline-flex items-center justify-center hover:opacity-75 cursor-pointer ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {!isAtLimit && (
          <div className="relative flex-1 min-w-[120px]">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedSkills.length === 0
                  ? 'Tag skills (e.g. Math, Coding)...'
                  : 'Add another skill...'
              }
              className="w-full text-base sm:text-2xs px-1 py-0.5 text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Autocomplete / Suggestions Popover */}
      {isOpen && !isAtLimit && (
        <div className="relative">
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-xs">
            {isLoading && (
              <div className="px-3 py-2 text-slate-400 text-2xs">Loading skills...</div>
            )}

            {!isLoading && filteredSkills.length === 0 && !canCreate && (
              <div className="px-3 py-2 text-slate-400 text-2xs italic">
                {skills.length === 0
                  ? 'No skills defined yet. Type a name to create one.'
                  : 'All matching skills are already selected.'}
              </div>
            )}

            {filteredSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleSelect(skill.id)}
                className="w-full px-3 py-2 sm:py-1.5 text-left flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: skill.color }}
                  />
                  <span className="text-slate-700 font-medium">{skill.name}</span>
                </div>
                <span className="text-2xs text-slate-400">
                  {skill.completedTaskCount} completed
                </span>
              </button>
            ))}

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={createSkill.isPending}
                className="w-full px-3 py-2 sm:py-1.5 text-left border-t border-slate-100 flex items-center gap-2 hover:bg-indigo-50 text-indigo-700 transition cursor-pointer font-medium text-xs sm:text-2xs"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Create skill "{query.trim()}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
