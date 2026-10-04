import React, { useState } from 'react';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from './use-tasks';
import { Check, Trash2, Plus, Loader2 } from 'lucide-react';

export function TaskList() {
  const [title, setTitle] = useState('');
  const { data: tasks = [], isLoading, error } = useTasks();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createTask.mutate(
      { title: trimmed },
      {
        onSuccess: () => setTitle(''),
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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do today?"
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm transition"
          autoFocus
        />
        <button
          type="submit"
          disabled={!title.trim() || createTask.isPending}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </button>
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
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3.5 rounded-lg border bg-white shadow-sm transition group ${
                task.isCompleted
                  ? 'border-slate-100 bg-slate-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTask.mutate({ id: task.id, isCompleted: !task.isCompleted })}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    task.isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                >
                  {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-sm transition-all ${
                    task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </span>
              </button>

              <button
                type="button"
                onClick={() => deleteTask.mutate(task.id)}
                aria-label="Delete task"
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
