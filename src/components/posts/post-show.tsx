import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { deletePost } from '@/actions';
import DeleteButton from '@/components/common/delete-button';
import Avatar from '@/components/common/avatar';
import { fetchPostById } from '@/db/queries/posts';
import paths from '@/paths';
import { topicTone, timeAgo } from '@/lib/utils';
import SurfacePanel from '@/components/common/surface-panel';

interface PostShowProps {
  postId: string;
}

export default async function PostShow({ postId }: PostShowProps) {
  const [post, session] = await Promise.all([
    fetchPostById(postId),
    auth(),
  ]);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tone = topicTone(post.topic.slug);
  const isOwner = session?.user?.id === post.userId;

  return (
    <SurfacePanel as="article" size="lg">
      {/* Tone band that ties the post to its topic */}
      <div className={`h-1.5 ${tone.dot}`} aria-hidden />

      <div className="px-6 sm:px-8 py-7 sm:py-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <Link
            href={paths.topicShow(post.topic.slug)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text} hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transition-none`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            <span className="lowercase">{post.topic.slug}</span>
          </Link>
          {isOwner && (
            <DeleteButton
              action={deletePost.bind(null, post.id)}
              confirmMessage="Delete this post? All comments will also be removed."
            />
          )}
        </div>

        <h1 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink leading-[1.1]">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-2">
          <div className="flex items-center gap-2">
            <Avatar user={post.user} size="sm" />
            <span className="font-semibold text-ink">{post.user.name}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-ink-3" aria-hidden />
          <time
            dateTime={post.createdAt.toISOString()}
            className="font-mono num-plate text-xs"
          >
            {formattedDate}
          </time>
          <span className="w-1 h-1 rounded-full bg-ink-3 hidden sm:inline-block" aria-hidden />
          <span
            className="font-mono text-xs text-ink-3 hidden sm:inline"
            suppressHydrationWarning
          >
            {timeAgo(post.createdAt)}
          </span>
        </div>

        <div className="mt-6 h-px bg-rule" />

        <p className="mt-6 text-ink-2 text-base sm:text-[17px] leading-[1.75] whitespace-pre-wrap">
          {post.content}
        </p>
      </div>
    </SurfacePanel>
  );
}
