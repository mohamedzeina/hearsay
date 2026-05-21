import Link from 'next/link';
import paths from '@/paths';
import type { PostWithData } from '@/db/queries/posts';
import { timeAgo, topicTone, stripMarkdown } from '@/lib/utils';
import { IconReply } from '@/components/icons';
import AuthorChip from '@/components/common/author-chip';
import VoteButton from '@/components/votes/vote-button';
import SaveButton from '@/components/posts/save-button';

interface PostCardProps {
  post: PostWithData;
  hideTopic?: boolean;
}

export default function PostCard({ post, hideTopic }: PostCardProps) {
  const tone = topicTone(post.topic.slug);
  const replyCount = post._count.comments;

  return (
    <Link
      href={paths.postShow(post.topic.slug, post.id)}
      className="group relative block rounded-2xl border border-rule bg-surface hover:border-rule-2 hover:shadow-lift transition-all duration-200 motion-reduce:transition-none overflow-hidden"
    >
      {/* Accent rail on the left, reveals on hover */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-persimmon scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300 motion-reduce:transition-none"
      />

      {/* Bookmark — top-right corner */}
      <div className="absolute top-3 right-3 z-10">
        <SaveButton
          postId={post.id}
          initialSaved={post.saves.length > 0}
        />
      </div>

      <div className="p-5 sm:p-6">
        {!hideTopic && (
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              {post.topic.slug}
            </span>
          </div>
        )}

        <h3 className="font-display text-lg sm:text-xl font-bold text-ink leading-snug pr-10 group-hover:text-persimmon-deep transition-colors duration-200 motion-reduce:transition-none">
          {post.title}
        </h3>

        <p className="mt-2 text-sm text-ink-2 line-clamp-2 leading-relaxed">
          {stripMarkdown(post.content)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <VoteButton
            kind="post"
            id={post.id}
            initialCount={post._count.votes}
            initialVoted={post.votes.length > 0}
            size="sm"
          />

          <span className="w-1 h-1 rounded-full bg-ink-3" aria-hidden />

          <AuthorChip user={post.user} />

          <span className="w-1 h-1 rounded-full bg-ink-3" aria-hidden />

          <span className="inline-flex items-center gap-1 text-ink-2">
            <IconReply className="w-3.5 h-3.5" />
            <span className="font-mono num-plate text-ink font-semibold">{replyCount}</span>
            <span>{replyCount === 1 ? 'reply' : 'replies'}</span>
          </span>

          <span className="w-1 h-1 rounded-full bg-ink-3" aria-hidden />

          <span
            className="font-mono num-plate text-ink-2"
            suppressHydrationWarning
          >
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
