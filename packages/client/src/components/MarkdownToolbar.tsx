import React from 'react';
import { Bold, Italic, List, Code, Link as LinkIcon, Eye, Edit3 } from 'lucide-react';

export interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (val: string) => void;
  mode: 'write' | 'preview';
  onModeChange: (mode: 'write' | 'preview') => void;
}

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  mode,
  onModeChange,
}: MarkdownToolbarProps) {
  const applyFormat = (prefix: string, suffix: string, defaultPlaceholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const replacement = selectedText || defaultPlaceholder;
    const newText = value.slice(0, start) + prefix + replacement + suffix + value.slice(end);

    onChange(newText);

    // Reset cursor position inside the wrapped text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + replacement.length);
    }, 0);
  };

  return (
    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border text-xs">
      {/* Left: Quick Formatting Buttons (horizontally scrollable on narrow mobile screens) */}
      <div className="flex items-center gap-0.5 overflow-x-auto py-0.5">
        <button
          type="button"
          onClick={() => applyFormat('**', '**', 'bold text')}
          title="Bold (**text**)"
          disabled={mode === 'preview'}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('*', '*', 'italic text')}
          title="Italic (*text*)"
          disabled={mode === 'preview'}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('- ', '', 'list item')}
          title="Bullet List (- item)"
          disabled={mode === 'preview'}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('`', '`', 'code')}
          title="Inline Code (`code`)"
          disabled={mode === 'preview'}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('[', '](https://)', 'link title')}
          title="Link ([title](url))"
          disabled={mode === 'preview'}
          className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Write / Preview Tab Switch */}
      <div className="flex items-center bg-muted rounded p-0.5 text-2xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => onModeChange('write')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
            mode === 'write'
              ? 'bg-card text-primary shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Edit3 className="w-3 h-3" />
          Write
        </button>
        <button
          type="button"
          onClick={() => onModeChange('preview')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
            mode === 'preview'
              ? 'bg-card text-primary shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
      </div>
    </div>
  );
}
