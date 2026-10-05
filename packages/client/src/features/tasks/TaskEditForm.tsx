import React, { useState, useRef, useEffect } from 'react';
import type { TaskDto, UpdateTaskDto, RecurrenceRule } from '@self/contracts';
import { CalendarDays, Clock, Check, X, FileText } from 'lucide-react';
import { parseLocalDate, formatLocalDate } from '../../lib/date-context';
import { MarkdownToolbar } from '../../components/MarkdownToolbar';
import { MarkdownViewer } from '../../components/MarkdownViewer';
import { RecurrencePicker } from './RecurrencePicker';
import { SkillSelector } from '../skills/SkillSelector';
import { Button, Input } from '../../components/ui';

export interface TaskEditFormProps {
  task: TaskDto;
  currentDate: string;
  onSave: (dto: UpdateTaskDto) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function TaskEditForm({
  task,
  currentDate,
  onSave,
  onCancel,
  isSaving = false,
}: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [descMode, setDescMode] = useState<'write' | 'preview'>('write');
  const [todoDate, setTodoDate] = useState(task.todoDate ?? '');
  const [deadline, setDeadline] = useState(task.deadline ? task.deadline.slice(0, 10) : '');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    task.recurrenceRule ?? null,
  );
  const [skillIds, setSkillIds] = useState<string[]>(
    task.skills ? task.skills.map((s) => s.id) : [],
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus and select text when opening edit mode for instant typing
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleTomorrow = () => {
    const base = parseLocalDate(currentDate);
    base.setDate(base.getDate() + 1);
    setTodoDate(formatLocalDate(base));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;

    const dto: UpdateTaskDto = {
      title: trimmedTitle,
      description: description.trim() ? description.trim() : null,
      todoDate: recurrenceRule
        ? (recurrenceRule.startDate ?? (todoDate ? todoDate : null))
        : todoDate
          ? todoDate
          : null,
      deadline: recurrenceRule ? null : deadline ? `${deadline}T23:59:59.000Z` : null,
      recurrenceRule: recurrenceRule ?? null,
      skillIds: skillIds,
    };

    onSave(dto);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl+Enter submits form from textarea
      e.preventDefault();
      handleSubmit();
    }
  };

  const isTitleEmpty = title.trim() === '';

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="card bg-base-100 p-3.5 border border-primary/40 shadow-sm space-y-3 transition-all"
    >
      {/* Title Input */}
      <div>
        <label htmlFor={`edit-task-title-${task.id}`} className="sr-only">
          Task Title
        </label>
        <Input
          ref={inputRef}
          id={`edit-task-title-${task.id}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="font-medium"
        />
        {isTitleEmpty && (
          <p className="text-2xs text-error mt-1 font-medium">Title cannot be empty</p>
        )}
      </div>

      {/* Formatted Description Editor */}
      <div className="rounded-lg border border-base-300 bg-base-200/40 p-2.5 space-y-2">
        <div className="flex items-center justify-between text-2xs font-medium text-base-content/70">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-primary" />
            Description (Markdown notes, checklists, code):
          </span>
          <span className="text-base-content/50">{description.length}/5000</span>
        </div>

        <MarkdownToolbar
          textareaRef={textareaRef}
          value={description}
          onChange={setDescription}
          mode={descMode}
          onModeChange={setDescMode}
        />

        {descMode === 'write' ? (
          <textarea
            ref={textareaRef}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add detailed notes, checklists (- item), or links ([text](url))..."
            maxLength={5000}
            className="textarea textarea-bordered w-full p-2.5 bg-base-100 text-base-content font-mono text-xs focus:textarea-primary resize-y"
          />
        ) : (
          <div className="min-h-[72px] p-2.5 rounded-lg border border-base-300 bg-base-100">
            {description.trim() ? (
              <MarkdownViewer content={description} />
            ) : (
              <p className="text-xs text-base-content/50 italic">
                No description content to preview.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Single-Task Date Controls (Hidden when Repeating) */}
      {!recurrenceRule && (
        <div className="pt-2 border-t border-base-300 flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-4 text-xs">
          {/* Todo Date (Execution Day) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`edit-todo-date-${task.id}`}
              className="text-base-content/70 font-medium flex items-center gap-1 text-2xs"
            >
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span>Todo Date (Execution):</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id={`edit-todo-date-${task.id}`}
                type="date"
                value={todoDate}
                onChange={(e) => setTodoDate(e.target.value)}
                className="input input-bordered input-sm font-mono text-base-content"
              />
              <button
                type="button"
                onClick={() => setTodoDate(currentDate)}
                className="btn btn-ghost btn-xs"
              >
                Today
              </button>
              <button type="button" onClick={handleTomorrow} className="btn btn-ghost btn-xs">
                +1d
              </button>
              {todoDate && (
                <button
                  type="button"
                  onClick={() => setTodoDate('')}
                  className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                  title="Clear todo date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Deadline (Cutoff Day) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`edit-deadline-${task.id}`}
              className="text-base-content/70 font-medium flex items-center gap-1 text-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-error" />
              <span>Deadline (Cutoff):</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id={`edit-deadline-${task.id}`}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input input-bordered input-sm font-mono text-base-content"
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                  title="Clear deadline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recurrence Rule Controls */}
      <RecurrencePicker
        value={recurrenceRule}
        onChange={setRecurrenceRule}
        currentDate={currentDate}
      />

      {/* Cultivated Skills Selector */}
      <SkillSelector selectedSkillIds={skillIds} onChange={setSkillIds} />

      {/* Action Buttons */}
      <div className="pt-2 border-t border-base-300 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isTitleEmpty || isSaving}>
          <Check className="w-3.5 h-3.5 mr-1" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
