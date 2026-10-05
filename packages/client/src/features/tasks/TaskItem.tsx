import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { TaskDto, UpdateTaskDto } from '@self/contracts';
import { getTaskStatus, TaskStatus, formatRecurrenceLabel } from '@self/contracts';
import { TaskEditForm } from './TaskEditForm';
import { MarkdownViewer } from '../../components/MarkdownViewer';
import { Badge, Button } from '../../components/ui';
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
  RotateCw,
  Sparkles,
} from 'lucide-react';

export interface TaskItemProps {
  task: TaskDto;
  currentDate: string;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, dto: UpdateTaskDto) => void;
}

export function TaskItem({ task, currentDate, onToggle, onDelete, onUpdate }: TaskItemProps) {
  const [itemRef] = useAutoAnimate<HTMLDivElement>({ duration: 150 });
  const [isEditing, setIsEditing] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [rewardVisible, setRewardVisible] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

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

  const handleToggleClick = () => {
    const nextCompleted = !task.isCompleted;
    if (nextCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 200);
      if (task.skills && task.skills.length > 0) {
        setRewardVisible(true);
        setTimeout(() => setRewardVisible(false), 2000);
      }
    }
    onToggle(task.id, nextCompleted);
  };

  return (
    <div
      ref={itemRef}
      className={`relative p-3.5 rounded-lg border transition-all duration-150 group ${
        task.isCompleted
          ? 'border-border/60 bg-muted/40'
          : isOverdue
            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-400'
            : isUpcoming
              ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400'
              : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Floating Micro-Reward Feedback Pill */}
      {rewardVisible && task.skills && task.skills.length > 0 && (
        <div
          data-testid="micro-reward-pill"
          className="absolute right-4 -top-3.5 z-20 flex items-center gap-1.5 shadow-md bg-card border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-full text-xs font-semibold animate-bounce motion-reduce:animate-none pointer-events-none"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          {task.skills.map((s) => (
            <span key={s.id} style={{ color: s.color }}>
              +1 #{s.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Completion Toggle button or Locked signifier */}
          {isUpcoming ? (
            <button
              type="button"
              disabled
              title={`Scheduled for ${task.todoDate}. Cannot be completed before its scheduled date.`}
              className="w-5 h-5 rounded border border-amber-300 dark:border-amber-700 bg-amber-100/60 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 cursor-not-allowed shrink-0"
            >
              <Lock className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleClick}
              aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
              className={`w-6 h-6 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-all duration-100 active:scale-90 motion-reduce:transform-none cursor-pointer shrink-0 ${
                task.isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-border hover:border-slate-400 bg-card'
              } ${justCompleted ? 'animate-checkmark-pop motion-reduce:animate-none' : ''}`}
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
              className={`text-sm truncate transition-colors duration-150 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
            >
              {task.title}
            </span>

            {/* Date / Status Badges */}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {isOverdue && !task.isCompleted && (
                <Badge variant="danger">
                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  Out of Date / Overdue
                </Badge>
              )}

              {isUpcoming && (
                <Badge variant="warning">
                  <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  Upcoming ({task.todoDate})
                </Badge>
              )}

              {task.todoDate && !isUpcoming && (
                <span className="text-2xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-muted-foreground" />
                  Todo: {task.todoDate}
                </span>
              )}

              {task.deadline && (
                <span
                  className={`text-2xs flex items-center gap-1 ${
                    isOverdue && !task.isCompleted
                      ? 'text-rose-700 dark:text-rose-400 font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Clock className="w-3 h-3 opacity-70" />
                  Cutoff: {task.deadline.slice(0, 10)}
                </span>
              )}

              {/* Recurrence Badge */}
              {task.recurrenceRule && (
                <Badge
                  variant="primary"
                  data-testid="recurrence-badge"
                  title={`Recurring task: ${formatRecurrenceLabel(task.recurrenceRule)}`}
                >
                  <RotateCw className="w-3 h-3 text-indigo-500" />
                  <span>{formatRecurrenceLabel(task.recurrenceRule)}</span>
                </Badge>
              )}

              {/* Associated Skill Badges */}
              {task.skills && task.skills.length > 0 && (
                <div className="flex items-center flex-wrap gap-1">
                  {task.skills.map((skill) => (
                    <span
                      key={skill.id}
                      data-testid={`skill-badge-${skill.name.toLowerCase()}`}
                      className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded font-medium border"
                      style={{
                        backgroundColor: `${skill.color}15`,
                        color: skill.color,
                        borderColor: `${skill.color}35`,
                      }}
                      title={`Cultivates skill: ${skill.name}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: skill.color }}
                      />
                      <span>#{skill.name}</span>
                    </span>
                  ))}
                </div>
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
                  className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground font-medium transition-all duration-75 active:scale-95 motion-reduce:transform-none cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
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
        <div className="flex items-center gap-0.5 sm:gap-1 ml-1 sm:ml-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            aria-label="Edit task"
            title="Edit task"
            className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            title="Delete task"
            className="text-muted-foreground hover:text-rose-500 dark:hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded Formatted Markdown Notes */}
      {hasDescription && isNotesExpanded && (
        <div className="mt-3 pt-2.5 border-t border-border pl-8 pr-2">
          <div className="p-2.5 bg-muted/40 rounded-md border border-border">
            <MarkdownViewer content={task.description!} />
          </div>
        </div>
      )}
    </div>
  );
}
