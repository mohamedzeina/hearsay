import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchUserProfileByUsername } from '@/db/queries/users';
import Avatar from '@/components/common/avatar';
import PostCard from '@/components/posts/post-card';
import VisitedLi from '@/components/posts/visited-li';
import SurfacePanel from '@/components/common/surface-panel';
import Breadcrumb from '@/components/common/breadcrumb';
import { stripMarkdown, timeAgo, topicTone } from '@/lib/utils';
import paths from '@/paths';

interface UserProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  const profile = await fetchUserProfileByUsername(username);
  if (!profile) notFound();

  const joinedLabel = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: `@${profile.username}` }]}
      />

      <header className="relative overflow-hidden rounded-3xl border border-rule bg-surface shadow-soft rise">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 0%, rgb(var(--persimmon-rgb) / 0.08), transparent 55%), radial-gradient(circle at 100% 100%, rgb(var(--ink-rgb) / 0.04), transparent 55%)',
          }}
        />

        <div className="relative px-6 sm:px-10 py-8 sm:py-10 flex flex-wrap items-center gap-6">
          <Avatar user={profile} size="lg" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
              writes on hearsay
            </p>
            <h1 className="mt-1 font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">
              {profile.name ?? profile.username}
            </h1>
            <p className="mt-1 font-mono text-sm text-ink-2">@{profile.username}</p>
            <p
              className="mt-3 text-xs font-mono text-ink-3 uppercase tracking-[0.1em]"
              suppressHydrationWarning
            >
              Joined {joinedLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <Stat label="posts" value={profile.postCount} />
            <Stat label="replies" value={profile.commentCount} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8 space-y-6">
          <section aria-label="Posts">
            <header className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-ink tracking-tight">
                {profile.postCount === 0
                  ? 'No posts yet'
                  : `${profile.postCount} ${profile.postCount === 1 ? 'post' : 'posts'}`}
              </h2>
              {profile.postCount > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
                  Newest at the top
                </span>
              )}
            </header>

            {profile.posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 py-10 text-center">
                <p className="text-sm text-ink-2">
                  @{profile.username} hasn&rsquo;t written anything yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {profile.posts.map((post) => (
                  <VisitedLi key={post.id} postId={post.id}>
                    <PostCard post={post} />
                  </VisitedLi>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-[calc(var(--nav-h)+2rem)]">
            <SurfacePanel as="section" aria-label="Recent replies">
              <header className="px-4 py-3 border-b border-rule flex items-baseline justify-between">
                <h3 className="font-display font-bold text-sm text-ink">Recent replies</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
                  {profile.commentCount}
                </span>
              </header>

              {profile.comments.length === 0 ? (
                <p className="px-4 py-6 text-xs text-ink-2 text-center">
                  Nothing here yet.
                </p>
              ) : (
                <ol className="max-h-[36rem] overflow-y-auto divide-y divide-rule">
                  {profile.comments.map((c) => {
                    const tone = topicTone(c.post.topic.slug);
                    return (
                      <li key={c.id}>
                        <Link
                          href={`${paths.postShow(c.post.topic.slug, c.post.id)}#c-${c.id}`}
                          className="group block px-4 py-3 hover:bg-cream-2/50 transition-colors duration-150 motion-reduce:transition-none"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] ${tone.bg} ${tone.text}`}
                            >
                              <span className={`w-1 h-1 rounded-full ${tone.dot}`} />
                              {c.post.topic.slug}
                            </span>
                            <span
                              className="font-mono text-[10px] text-ink-3 num-plate"
                              suppressHydrationWarning
                            >
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-ink truncate group-hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none">
                            on &ldquo;{c.post.title}&rdquo;
                          </p>
                          <p className="text-xs text-ink-2 leading-snug line-clamp-2 mt-0.5">
                            {stripMarkdown(c.content)}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </SurfacePanel>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream-2/60 px-4 py-3 min-w-[110px]">
      <p className="font-display font-bold text-2xl text-ink num-plate leading-none">
        {value.toLocaleString()}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2 mt-1.5">
        {label}
      </p>
    </div>
  );
}
