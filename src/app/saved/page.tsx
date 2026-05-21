import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/server-utils';
import { fetchSavedPosts } from '@/db/queries/saved-posts';
import PostCard from '@/components/posts/post-card';
import Breadcrumb from '@/components/common/breadcrumb';
import { IconBookmark } from '@/components/icons';
import paths from '@/paths';

export const metadata = {
  title: 'Saved posts',
};

export default async function SavedPostsPage() {
  const user = await requireAuth();
  if (!user) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(paths.savedPosts())}`);

  const posts = await fetchSavedPosts(user.id);

  return (
    <div className="py-8 sm:py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Saved' }]} />

      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            your bookmarks
          </p>
          <h1 className="mt-1 font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">
            Saved posts
          </h1>
        </div>
        {posts.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
            Newest save first
          </span>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 py-14 text-center">
          <IconBookmark
            className="w-8 h-8 mx-auto text-ink-3 mb-3"
            aria-hidden
          />
          <p className="font-display font-bold text-lg text-ink mb-1">
            Nothing saved yet
          </p>
          <p className="text-sm text-ink-2 mb-4 max-w-sm mx-auto">
            Tap the bookmark on any post and it&rsquo;ll land here, in
            the order you saved them.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none"
          >
            Browse posts &rarr;
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
