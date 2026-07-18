import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../utils/cn.js';

const components = {
  a: ({ ...props }) => (
    <a {...props} target="_blank" rel="noreferrer" className="underline text-sky-300" />
  ),
  code: ({ inline, className, children, ...props }) =>
    inline ? (
      <code className="rounded bg-black/30 px-1 py-0.5 text-[0.85em]" {...props}>
        {children}
      </code>
    ) : (
      <pre className="my-1 overflow-x-auto rounded-lg bg-black/40 p-2 text-xs">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ),
  ul: ({ children }) => <ul className="list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4">{children}</ol>,
};

export default function Markdown({ children, className }) {
  return (
    <div className={cn('whitespace-pre-wrap break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
