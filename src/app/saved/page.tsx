import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/server-utils';
import { fetchSavedPosts } from '@/db/queries/saved-posts';
import Breadcrumb from '@/components/common/breadcrumb';
import SavedPostsList from '@/components/posts/saved-posts-list';
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
      <SavedPostsList initialPosts={posts} />
    </div>
  );
}
