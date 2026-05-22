import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Markdown from '@/components/common/markdown';

describe('Markdown', () => {
  it('renders plain text inside a paragraph', () => {
    render(<Markdown content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold and italic formatting', () => {
    const { container } = render(<Markdown content="**bold** and *italic*" />);
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('em')).toHaveTextContent('italic');
  });

  it('renders links with target=_blank and noopener', () => {
    render(<Markdown content="[hearsay](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'hearsay' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toMatch(/noopener/);
    expect(link.getAttribute('rel')).toMatch(/nofollow/);
  });

  it('renders inline code', () => {
    const { container } = render(<Markdown content="Use `npm test`" />);
    const code = container.querySelector('code');
    expect(code).toHaveTextContent('npm test');
  });

  it('renders fenced code blocks', () => {
    const md = '```\nconst x = 1;\n```';
    const { container } = render(<Markdown content={md} />);
    expect(container.querySelector('pre')).not.toBeNull();
    expect(container.querySelector('pre code')).toHaveTextContent('const x = 1;');
  });

  it('does not give unlanguaged fenced blocks the inline-pill background', () => {
    // Regression: when the code element had no `language-*` class we used to
    // mark it as inline and render it with bg-cream-2 + border + rounded,
    // which looks like an inline chip floating inside the <pre> block.
    const md = '```\nconst x = 1;\n```';
    const { container } = render(<Markdown content={md} />);
    const pre = container.querySelector('pre');
    expect(pre?.className).toMatch(/bg-cream-2/);
    // The pre must strip the inline pill styling from any nested <code>.
    expect(pre?.className).toMatch(/\[&_code\]:bg-transparent/);
  });

  it('renders fenced blocks with a language hint', () => {
    const md = '```js\nconst x = 1;\n```';
    const { container } = render(<Markdown content={md} />);
    const code = container.querySelector('pre code');
    expect(code).not.toBeNull();
    expect(code?.className).toMatch(/language-js/);
  });

  it('renders blockquotes', () => {
    const { container } = render(<Markdown content="> a quoted line" />);
    expect(container.querySelector('blockquote')).toHaveTextContent(
      'a quoted line'
    );
  });

  it('renders unordered lists', () => {
    const md = '- one\n- two\n- three';
    const { container } = render(<Markdown content={md} />);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('one');
  });

  it('drops images (img component returns null)', () => {
    const { container } = render(
      <Markdown content="An image: ![alt](https://example.com/x.png)" />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('does not render raw HTML (script tags become text)', () => {
    const { container } = render(
      <Markdown content="<script>alert(1)</script> hi" />
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('supports GitHub-flavored strikethrough via remark-gfm', () => {
    const { container } = render(<Markdown content="~~struck~~" />);
    expect(container.querySelector('del')).toHaveTextContent('struck');
  });

  it('autolinks bare URLs via remark-gfm', () => {
    render(<Markdown content="see https://example.com here" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('downsizes h1 to a smaller heading (avoids competing with post title)', () => {
    const { container } = render(<Markdown content="# a heading" />);
    // We map h1 → h3 inside content to avoid competing with the post headline.
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h3')).toHaveTextContent('a heading');
  });

  it('applies "comment" variant prose classes when variant=comment', () => {
    const { container } = render(
      <Markdown content="hello" variant="comment" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/prose-p:my-0/);
  });
});
