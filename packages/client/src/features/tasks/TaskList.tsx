import React, { useState } from 'react';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask, useUpdateTask } from './use-tasks';
import { useCurrentDate } from '../../lib/date-context';
import { TaskItem } from './TaskItem';
import { Plus, Loader2, Calendar, Clock, CalendarDays, FileText } from 'lucide-react';

export function TaskList() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [todoDate, setTodoDate] = useState('');
  const [deadline, setDeadline] = useState('');
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
        todoDate: todoDate || undefined,
        deadline: deadline ? `${deadline}T23:59:59.000Z` : undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setTodoDate('');
          setDeadline('');
          setShowDetails(false);
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
            onClick={() => setShowDetails(!showDetails)}
            title="Set execution date, deadline, or notes"
            className={`px-3 py-2.5 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              showDetails || todoDate || deadline || description
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
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

        {/* Expandable Details Drawer */}
        {showDetails && (
          <div className="pt-2.5 border-t border-slate-100 space-y-3 text-xs">
            {/* Optional Description Input */}
            <div className="space-y-1">
              <label
                htmlFor="new-task-description"
                className="text-slate-600 font-medium flex items-center gap-1 text-2xs"
              >
                <FileText className="w-3 h-3 text-indigo-600" />
                <span>Notes / Description (Markdown):</span>
              </label>
              <textarea
                id="new-task-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional detailed steps (- item), links, or code notes..."
                maxLength={5000}
                className="w-full p-2 rounded border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-y"
              />
            </div>

            {/* Date Pickers */}
            <div className="flex flex-wrap gap-4">
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
