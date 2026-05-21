import { fetchPostById } from '@/db/queries/posts';
import { db } from '@/db';
import SurfacePanel from '@/components/common/surface-panel';
import Avatar from '@/components/common/avatar';
import AuthorName from '@/components/common/author-name';

interface PostAuthorProps {
  postId: string;
}

export default async function PostAuthor({ postId }: PostAuthorProps) {
  const post = await fetchPostById(postId);
  if (!post) return null;

  const userStats = await db.user.findUnique({
    where: { id: post.userId },
    select: {
      _count: {
        select: {
          Post: true,
          Comment: { where: { deleted: false } },
        },
      },
    },
  });
  const userPostCount = userStats?._count.Post ?? 0;
  const userReplyCount = userStats?._count.Comment ?? 0;

  return (
    <SurfacePanel as="section" aria-label="About the author">
      <header className="px-4 py-3 border-b border-rule flex items-baseline justify-between">
        <h3 className="font-display font-bold text-sm text-ink">Author</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
          said it first
        </span>
      </header>

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar user={post.user} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <AuthorName
              user={post.user}
              className="font-display font-bold text-ink truncate block hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
            />
            <p className="text-[11px] font-mono text-ink-2 uppercase tracking-[0.1em]">
              writes on hearsay
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Stat label="posts" value={userPostCount} />
          <Stat label="replies" value={userReplyCount} />
        </div>
      </div>
    </SurfacePanel>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream-2/60 px-3 py-2.5">
      <p className="font-display font-bold text-xl text-ink num-plate leading-none">
        {value.toLocaleString()}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2 mt-1.5">
        {label}
      </p>
    </div>
  );
}
