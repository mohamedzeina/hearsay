import type { Root } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';
import { mentionRegex } from '@/lib/mentions';

// Walks the mdast tree, finds @username in text nodes, and replaces each
// match with a `link` node pointing at /u/<username>. The downstream
// react-markdown `a` override detects mentions by href shape and renders
// them with mention-specific styling (no target=_blank, etc.).
//
// `findAndReplace` skips link / linkReference parents so a markdown link
// whose visible text happens to contain "@user" isn't double-wrapped.
export default function remarkMentions() {
  return (tree: Root) => {
    findAndReplace(
      tree,
      [
        [
          mentionRegex(),
          (_full: string, username: string) => ({
            type: 'link',
            url: `/u/${username}`,
            children: [{ type: 'text', value: `@${username}` }],
          }),
        ],
      ],
      { ignore: ['link', 'linkReference'] }
    );
  };
}
