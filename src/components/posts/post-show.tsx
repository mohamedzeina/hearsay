import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import VoteButton from '@/components/votes/vote-button';
import SaveButton from '@/components/posts/save-button';
import { fetchPostById } from '@/db/queries/posts';
import paths from '@/paths';
import { topicTone } from '@/lib/utils';
import SurfacePanel from '@/components/common/surface-panel';
import PostEditable from '@/components/posts/post-editable';

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

  const tone = topicTone(post.topic.slug);
  const isOwner = session?.user?.id === post.userId;

  return (
    <SurfacePanel as="article" size="lg">
      {/* Tone band that ties the post to its topic */}
      <div className={`h-1.5 ${tone.dot}`} aria-hidden />

      <div className="px-6 sm:px-8 py-7 sm:py-8">
        <div className="mb-4">
          <Link
            href={paths.topicShow(post.topic.slug)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text} hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transition-none`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
            <span className="lowercase">{post.topic.slug}</span>
          </Link>
        </div>

        <PostEditable
          postId={post.id}
          initialTitle={post.title}
          initialContent={post.content}
          isOwner={isOwner}
          author={post.user}
          createdAt={post.createdAt}
          editedAt={post.editedAt}
        />

        <div className="mt-7 pt-5 border-t border-rule flex items-center gap-3">
          <VoteButton
            kind="post"
            id={post.id}
            initialCount={post._count.votes}
            initialVoted={post.votes.length > 0}
            size="md"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            {post._count.votes === 1 ? 'upvote' : 'upvotes'} &middot; agree out loud
          </span>
          <div className="ml-auto">
            <SaveButton
              postId={post.id}
              initialSaved={post.saves.length > 0}
              size="md"
            />
          </div>
        </div>
      </div>
    </SurfacePanel>
  );
}
