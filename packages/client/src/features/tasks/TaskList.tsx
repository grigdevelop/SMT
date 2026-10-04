import React, { useState } from 'react';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from './use-tasks';
import { useCurrentDate } from '../../lib/date-context';
import { getTaskStatus, TaskStatus } from '@self/contracts';
import {
  Check,
  Trash2,
  Plus,
  Loader2,
  Lock,
  Calendar,
  Clock,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

export function TaskList() {
  const [title, setTitle] = useState('');
  const [todoDate, setTodoDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showDateControls, setShowDateControls] = useState(false);

  const { currentDate } = useCurrentDate();
  const { data: tasks = [], isLoading, error } = useTasks();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createTask.mutate(
      {
        title: trimmed,
        todoDate: todoDate || undefined,
        deadline: deadline ? `${deadline}T23:59:59.000Z` : undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setTodoDate('');
          setDeadline('');
          setShowDateControls(false);
        },
      },
    );
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        Failed to load tasks. Make sure the server is running.
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Add Task Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do today?"
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 text-sm transition"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowDateControls(!showDateControls)}
            title="Set execution date or deadline"
            className={`px-3 py-2.5 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              showDateControls || todoDate || deadline
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Dates</span>
          </button>
          <button
            type="submit"
            disabled={!title.trim() || createTask.isPending}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        {/* Expandable Date Selectors */}
        {showDateControls && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label
                htmlFor="todo-date-input"
                className="text-slate-600 font-medium flex items-center gap-1"
              >
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>Todo Date (Execution):</span>
              </label>
              <input
                id="todo-date-input"
                type="date"
                value={todoDate}
                onChange={(e) => setTodoDate(e.target.value)}
                className="px-2 py-1 rounded border border-slate-200 bg-white font-mono text-slate-700 text-xs shadow-2xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setTodoDate(currentDate)}
                className="text-2xs text-indigo-600 hover:underline cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="deadline-input"
                className="text-slate-600 font-medium flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Deadline:</span>
              </label>
              <input
                id="deadline-input"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-2 py-1 rounded border border-slate-200 bg-white font-mono text-slate-700 text-xs shadow-2xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </form>

      {/* Progress Counter */}
      {tasks.length > 0 && (
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-1">
          <span>
            {completedCount} of {tasks.length} completed
          </span>
          <span>{Math.round((completedCount / tasks.length) * 100)}%</span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
            No tasks yet. Add your first task above.
          </div>
        ) : (
          tasks.map((task) => {
            const status = getTaskStatus(task, currentDate);
            const isUpcoming = status === TaskStatus.UPCOMING;
            const isOverdue = status === TaskStatus.OVERDUE;

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3.5 rounded-lg border transition group ${
                  task.isCompleted
                    ? 'border-slate-100 bg-slate-50/50'
                    : isOverdue
                      ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                      : isUpcoming
                        ? 'border-amber-200/70 bg-amber-50/20 hover:border-amber-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Completion Toggle button or Locked signifier */}
                  {isUpcoming ? (
                    <button
                      type="button"
                      disabled
                      title={`Scheduled for ${task.todoDate}. Cannot be completed before its scheduled date.`}
                      className="w-5 h-5 rounded border border-amber-300 bg-amber-100/60 flex items-center justify-center text-amber-700 cursor-not-allowed shrink-0"
                    >
                      <Lock className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        toggleTask.mutate({ id: task.id, isCompleted: !task.isCompleted })
                      }
                      aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    >
                      {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  )}

                  {/* Task Title & Details */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-sm truncate transition-all ${
                        task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Date / Status Badges */}
                    <div className="flex items-center gap-2 mt-1">
                      {isOverdue && !task.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Out of Date / Overdue
                        </span>
                      )}

                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-medium border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Upcoming ({task.todoDate})
                        </span>
                      )}

                      {task.todoDate && !isUpcoming && (
                        <span className="text-2xs text-slate-500 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          Todo: {task.todoDate}
                        </span>
                      )}

                      {task.deadline && (
                        <span
                          className={`text-2xs flex items-center gap-1 ${
                            isOverdue && !task.isCompleted
                              ? 'text-rose-700 font-medium'
                              : 'text-slate-500'
                          }`}
                        >
                          <Clock className="w-3 h-3 opacity-70" />
                          Cutoff: {task.deadline.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete action */}
                <button
                  type="button"
                  onClick={() => deleteTask.mutate(task.id)}
                  aria-label="Delete task"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1.5 rounded transition cursor-pointer shrink-0 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
