import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  // 'body' = post bodies (larger leading, ink-2 text). 'comment' = tight comment leading.
  variant?: 'body' | 'comment';
  className?: string;
}

// Restricted allowlist: text formatting, links, lists, code, quotes, tables.
// Images and raw HTML are dropped — react-markdown ignores raw HTML by default
// since we never pass `rehype-raw`, and we override the image component to null.
const components: Components = {
  // Markdown headings inside user content are downsized so a stray `# title`
  // doesn't compete with the actual post headline.
  h1: ({ node, ...props }) => <h3 className="font-display font-bold text-lg mt-4 mb-2 text-ink" {...props} />,
  h2: ({ node, ...props }) => <h3 className="font-display font-bold text-base mt-4 mb-2 text-ink" {...props} />,
  h3: ({ node, ...props }) => <h4 className="font-display font-semibold text-base mt-3 mb-1.5 text-ink" {...props} />,
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-persimmon-deep underline decoration-persimmon/40 underline-offset-2 hover:decoration-persimmon transition-colors"
      target="_blank"
      rel="noopener noreferrer nofollow"
    />
  ),
  code: ({ node, className, children, ...props }) => {
    const inline = !className?.includes('language-');
    if (inline) {
      return (
        <code
          className="font-mono text-[0.875em] px-1 py-0.5 rounded bg-cream-2 text-ink border border-rule"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={`${className ?? ''} font-mono text-[0.875em]`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ node, ...props }) => (
    <pre
      className="my-3 p-3 rounded-xl bg-cream-2 border border-rule overflow-x-auto text-ink"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-3 pl-4 border-l-2 border-persimmon/40 text-ink-2 italic"
      {...props}
    />
  ),
  // Images get dropped — return nothing.
  img: () => null,
};

export default function Markdown({
  content,
  variant = 'body',
  className = '',
}: MarkdownProps) {
  const prose =
    variant === 'body'
      ? 'prose prose-sm sm:prose-base max-w-none prose-p:text-ink-2 prose-p:leading-[1.75] prose-li:text-ink-2 prose-strong:text-ink prose-strong:font-semibold'
      : 'prose prose-sm max-w-none prose-p:text-ink-2 prose-p:leading-[1.65] prose-p:my-0 prose-li:text-ink-2 prose-strong:text-ink prose-strong:font-semibold';

  return (
    <div className={`${prose} ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
