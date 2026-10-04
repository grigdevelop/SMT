import React, { useState, useRef, useEffect } from 'react';
import type { TaskDto, UpdateTaskDto, RecurrenceRule } from '@self/contracts';
import { CalendarDays, Clock, Check, X, FileText } from 'lucide-react';
import { parseLocalDate, formatLocalDate } from '../../lib/date-context';
import { MarkdownToolbar } from '../../components/MarkdownToolbar';
import { MarkdownViewer } from '../../components/MarkdownViewer';
import { RecurrencePicker } from './RecurrencePicker';
import { SkillSelector } from '../skills/SkillSelector';

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
      className="p-3.5 rounded-lg border border-indigo-200 bg-white ring-2 ring-indigo-50 shadow-xs space-y-3 transition-all"
    >
      {/* Title Input */}
      <div>
        <label htmlFor={`edit-task-title-${task.id}`} className="sr-only">
          Task Title
        </label>
        <input
          ref={inputRef}
          id={`edit-task-title-${task.id}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        {isTitleEmpty && (
          <p className="text-2xs text-rose-600 mt-1 font-medium">Title cannot be empty</p>
        )}
      </div>

      {/* Formatted Description Editor */}
      <div className="rounded-md border border-slate-200 bg-slate-50/50 p-2.5 space-y-2">
        <div className="flex items-center justify-between text-2xs font-medium text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Description (Markdown notes, checklists, code):
          </span>
          <span className="text-slate-400">{description.length}/5000</span>
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
            className="w-full p-2 rounded border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
        ) : (
          <div className="min-h-[72px] p-2.5 rounded border border-slate-200 bg-white">
            {description.trim() ? (
              <MarkdownViewer content={description} />
            ) : (
              <p className="text-xs text-slate-400 italic">No description content to preview.</p>
            )}
          </div>
        )}
      </div>

      {/* Single-Task Date Controls (Hidden when Repeating) */}
      {!recurrenceRule && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
          {/* Todo Date (Execution Day) */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`edit-todo-date-${task.id}`}
              className="text-slate-600 font-medium flex items-center gap-1 text-2xs"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>Todo Date (Execution):</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id={`edit-todo-date-${task.id}`}
                type="date"
                value={todoDate}
                onChange={(e) => setTodoDate(e.target.value)}
                className="px-2 py-1 rounded border border-slate-200 bg-white font-mono text-slate-700 text-xs shadow-2xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setTodoDate(currentDate)}
                className="text-2xs px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleTomorrow}
                className="text-2xs px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
              >
                +1d
              </button>
              {todoDate && (
                <button
                  type="button"
                  onClick={() => setTodoDate('')}
                  className="text-2xs px-1.5 py-1 rounded hover:bg-rose-50 text-rose-600 font-medium cursor-pointer"
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
              className="text-slate-600 font-medium flex items-center gap-1 text-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Deadline (Cutoff):</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id={`edit-deadline-${task.id}`}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-2 py-1 rounded border border-slate-200 bg-white font-mono text-slate-700 text-xs shadow-2xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="text-2xs px-1.5 py-1 rounded hover:bg-rose-50 text-rose-600 font-medium cursor-pointer"
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
      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isTitleEmpty || isSaving}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>
    </form>
  );
}
