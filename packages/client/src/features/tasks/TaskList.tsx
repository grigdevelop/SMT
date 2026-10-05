import React, { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { RecurrenceRule } from '@self/contracts';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask, useUpdateTask } from './use-tasks';
import { useCurrentDate } from '../../lib/date-context';
import { TaskItem } from './TaskItem';
import { RecurrencePicker } from './RecurrencePicker';
import { Button, Input } from '../../components/ui';
import { Plus, Loader2, Calendar, Clock, CalendarDays, FileText } from 'lucide-react';

import { SkillSelector } from '../skills/SkillSelector';

export function TaskList() {
  const [formRef] = useAutoAnimate<HTMLFormElement>({ duration: 150 });
  const [listRef] = useAutoAnimate<HTMLDivElement>({ duration: 150 });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [todoDate, setTodoDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const { currentDate } = useCurrentDate();
  const { data: tasks = [], isLoading, error } = useTasks();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createTask.mutate(
      {
        title: trimmed,
        description: description.trim() ? description.trim() : undefined,
        todoDate: recurrenceRule ? undefined : todoDate || undefined,
        deadline: recurrenceRule ? undefined : deadline ? `${deadline}T23:59:59.000Z` : undefined,
        recurrenceRule: recurrenceRule || undefined,
        skillIds: skillIds.length > 0 ? skillIds : undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setTodoDate('');
          setDeadline('');
          setRecurrenceRule(null);
          setSkillIds([]);
          setShowDetails(false);
        },
      },
    );
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 rounded-lg text-sm">
        Failed to load tasks. Make sure the server is running.
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Add Task Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-3 bg-card p-4 rounded-xl border border-border shadow-2xs transition-colors"
      >
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do today?"
            className="flex-1 min-w-0"
            autoFocus
          />
          <Button
            type="button"
            variant={
              showDetails ||
              todoDate ||
              deadline ||
              description ||
              recurrenceRule ||
              skillIds.length > 0
                ? 'secondary'
                : 'outline'
            }
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            title="Set execution date, deadline, or notes"
            className="gap-1 sm:gap-1.5 shrink-0"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden xs:inline">Details</span>
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || createTask.isPending}
            size="sm"
            className="gap-1 shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-0.5" />
            <span className="hidden xs:inline">Add</span>
          </Button>
        </div>

        {/* Expandable Details Drawer */}
        {showDetails && (
          <div className="pt-2.5 border-t border-border space-y-3 text-xs">
            {/* Optional Description Input */}
            <div className="space-y-1">
              <label
                htmlFor="new-task-description"
                className="text-muted-foreground font-medium flex items-center gap-1 text-2xs"
              >
                <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Notes / Description (Markdown):</span>
              </label>
              <textarea
                id="new-task-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional detailed steps (- item), links, or code notes..."
                maxLength={5000}
                className="w-full p-2 rounded-lg border border-border bg-card text-base sm:text-xs text-foreground placeholder:text-muted-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            {/* Single-Task Date Pickers (Hidden when Repeating) */}
            {!recurrenceRule && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-4">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <label
                    htmlFor="todo-date-input"
                    className="text-muted-foreground font-medium flex items-center gap-1 shrink-0"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Todo Date:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="todo-date-input"
                      type="date"
                      value={todoDate}
                      onChange={(e) => setTodoDate(e.target.value)}
                      className="px-2 py-1 rounded-md border border-border bg-card font-mono text-foreground text-base sm:text-xs shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setTodoDate(currentDate)}
                      className="text-2xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Today
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <label
                    htmlFor="deadline-input"
                    className="text-muted-foreground font-medium flex items-center gap-1 shrink-0"
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Deadline:</span>
                  </label>
                  <input
                    id="deadline-input"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="px-2 py-1 rounded-md border border-border bg-card font-mono text-foreground text-base sm:text-xs shadow-2xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
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
          </div>
        )}
      </form>

      {/* Progress Counter */}
      {tasks.length > 0 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium px-1">
          <span>
            {completedCount} of {tasks.length} completed
          </span>
          <span>{Math.round((completedCount / tasks.length) * 100)}%</span>
        </div>
      )}

      {/* Task List */}
      <div ref={listRef} className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm bg-card/30">
            No tasks yet. Add your first task above.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              currentDate={currentDate}
              onToggle={(id, isCompleted) => toggleTask.mutate({ id, isCompleted })}
              onDelete={(id) => deleteTask.mutate(id)}
              onUpdate={(id, dto) => updateTask.mutate({ id, dto })}
            />
          ))
        )}
      </div>
    </div>
  );
}
