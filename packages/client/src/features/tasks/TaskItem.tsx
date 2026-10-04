import { useState } from 'react';
import type { TaskDto, UpdateTaskDto } from '@self/contracts';
import { getTaskStatus, TaskStatus } from '@self/contracts';
import { TaskEditForm } from './TaskEditForm';
import { MarkdownViewer } from '../../components/MarkdownViewer';
import {
  Check,
  Trash2,
  Lock,
  Clock,
  AlertCircle,
  CalendarDays,
  Pencil,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface TaskItemProps {
  task: TaskDto;
  currentDate: string;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, dto: UpdateTaskDto) => void;
}

export function TaskItem({ task, currentDate, onToggle, onDelete, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const status = getTaskStatus(task, currentDate);
  const isUpcoming = status === TaskStatus.UPCOMING;
  const isOverdue = status === TaskStatus.OVERDUE;
  const hasDescription = Boolean(task.description && task.description.trim());

  if (isEditing) {
    return (
      <TaskEditForm
        task={task}
        currentDate={currentDate}
        onSave={(dto) => {
          onUpdate(task.id, dto);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      className={`p-3.5 rounded-lg border transition group ${
        task.isCompleted
          ? 'border-slate-100 bg-slate-50/50'
          : isOverdue
            ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
            : isUpcoming
              ? 'border-amber-200/70 bg-amber-50/20 hover:border-amber-300'
              : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between">
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
              onClick={() => onToggle(task.id, !task.isCompleted)}
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

          {/* Task Title & Details (clickable to edit) */}
          <div
            onClick={() => setIsEditing(true)}
            className="flex flex-col min-w-0 flex-1 cursor-pointer select-none"
            title="Click to edit task"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(true);
              }
            }}
          >
            <span
              className={`text-sm truncate transition-all hover:text-indigo-600 ${
                task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
              }`}
            >
              {task.title}
            </span>

            {/* Date / Status Badges */}
            <div className="flex items-center flex-wrap gap-2 mt-1">
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
                    isOverdue && !task.isCompleted ? 'text-rose-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  <Clock className="w-3 h-3 opacity-70" />
                  Cutoff: {task.deadline.slice(0, 10)}
                </span>
              )}

              {/* Collapsible Notes Pill */}
              {hasDescription && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotesExpanded(!isNotesExpanded);
                  }}
                  title={isNotesExpanded ? 'Collapse notes' : 'View formatted notes'}
                  className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-indigo-600" />
                  <span>Notes</span>
                  {isNotesExpanded ? (
                    <ChevronUp className="w-2.5 h-2.5" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons (Edit & Delete) */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit task"
            title="Edit task"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-indigo-600 p-1.5 rounded transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            title="Delete task"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-500 p-1.5 rounded transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Formatted Markdown Notes */}
      {hasDescription && isNotesExpanded && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 pl-8 pr-2">
          <div className="p-2.5 bg-slate-50/80 rounded-md border border-slate-200/80">
            <MarkdownViewer content={task.description!} />
          </div>
        </div>
      )}
    </div>
  );
}
