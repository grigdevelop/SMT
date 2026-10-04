import React, { useState, useRef, useEffect } from 'react';
import type { TaskDto, UpdateTaskDto } from '@self/contracts';
import { CalendarDays, Clock, Check, X } from 'lucide-react';
import { parseLocalDate, formatLocalDate } from '../../lib/date-context';

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
  const [todoDate, setTodoDate] = useState(task.todoDate ?? '');
  const [deadline, setDeadline] = useState(task.deadline ? task.deadline.slice(0, 10) : '');
  const inputRef = useRef<HTMLInputElement>(null);

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
    const trimmed = title.trim();
    if (!trimmed || isSaving) return;

    const dto: UpdateTaskDto = {
      title: trimmed,
      todoDate: todoDate ? todoDate : null,
      deadline: deadline ? `${deadline}T23:59:59.000Z` : null,
    };

    onSave(dto);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
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

      {/* Date Controls */}
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
