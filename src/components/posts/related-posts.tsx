import Link from 'next/link';
import paths from '@/paths';
import { timeAgo } from '@/lib/utils';
import SurfacePanel from '@/components/common/surface-panel';
import { fetchRelatedPosts } from '@/db/queries/posts';
import VisitedLi from '@/components/posts/visited-li';

interface RelatedPostsProps {
  postId: string;
  topicSlug: string;
}

export default async function RelatedPosts({
  postId,
  topicSlug,
}: RelatedPostsProps) {
  const posts = await fetchRelatedPosts(postId, topicSlug);

  if (posts.length === 0) return null;

  return (
    <SurfacePanel as="section" aria-label="More in this topic">
      <header className="px-4 py-3 border-b border-rule flex items-baseline justify-between">
        <h3 className="font-display font-bold text-sm text-ink">
          More in <span className="lowercase">#{topicSlug}</span>
        </h3>
        <Link
          href={paths.topicShow(topicSlug)}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
        >
          all &rarr;
        </Link>
      </header>
      <ol>
        {posts.map((post, i) => (
          <VisitedLi
            key={post.id}
            postId={post.id}
            className="border-b border-rule last:border-b-0"
          >
            <Link
              href={paths.postShow(topicSlug, post.id)}
              className="group flex items-start gap-3 px-4 py-3 hover:bg-cream-2/50 transition-colors duration-150 motion-reduce:transition-none"
            >
              <span className="font-mono text-[10px] text-ink-3 num-plate pt-1 w-6 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none">
                  {post.title}
                </p>
                <p className="font-mono text-[10px] text-ink-2 mt-1.5 uppercase tracking-[0.06em]">
                  <span className="num-plate">{post._count.comments}</span>{' '}
                  {post._count.comments === 1 ? 'reply' : 'replies'}{' '}
                  <span className="text-ink-3">&middot;</span>{' '}
                  <span suppressHydrationWarning>{timeAgo(post.createdAt)}</span>
                </p>
              </div>
            </Link>
          </VisitedLi>
        ))}
      </ol>
    </SurfacePanel>
  );
}
