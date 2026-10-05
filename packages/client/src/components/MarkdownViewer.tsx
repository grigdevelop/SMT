import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface MarkdownViewerProps {
  content: string;
  className?: string;
}

// Configure marked options for clean CommonMark/GFM rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  const sanitizedHtml = useMemo(() => {
    if (!content.trim()) return '';
    try {
      const rawHtml = marked.parse(content) as string;
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel'],
      });
    } catch {
      return content;
    }
  }, [content]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <div
      className={`prose prose-sm max-w-none text-foreground text-xs leading-relaxed space-y-1.5 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-foreground [&_pre]:bg-slate-900 dark:[&_pre]:bg-slate-950 [&_pre]:text-slate-100 [&_pre]:p-2.5 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-2.5 [&_blockquote]:italic ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
