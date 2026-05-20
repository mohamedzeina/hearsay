import PostShow from '@/components/posts/post-show';
import PostBreadcrumb from '@/components/posts/post-breadcrumb';
import CommentList from '@/components/comments/comment-list';
import CommentCreateForm from '@/components/comments/comment-create-form';
import PostAuthor from '@/components/posts/post-author';
import ThreadMap from '@/components/posts/thread-map';
import RelatedPosts from '@/components/posts/related-posts';
import { Suspense } from 'react';
import PostShowLoading from '@/components/posts/post-show-loading';
import CommentListLoading from '@/components/comments/comment-list-loading';
import SurfacePanel from '@/components/common/surface-panel';
import { IconReply } from '@/components/icons';

interface PostShowPageProps {
  params: {
    slug: string;
    postId: string;
  };
}

export default async function PostShowPage({ params }: PostShowPageProps) {
  const { slug, postId } = params;

  return (
    <div className="py-8 sm:py-10">
      <Suspense
        fallback={
          <div className="h-4 w-48 bg-cream-2 rounded animate-pulse mb-6" />
        }
      >
        <PostBreadcrumb postId={postId} slug={slug} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <Suspense fallback={<PostShowLoading />}>
            <PostShow postId={postId} />
          </Suspense>

          <div id="reply">
            <CommentCreateForm postId={postId} startOpen />
          </div>

          <Suspense fallback={<CommentListLoading />}>
            <CommentList postId={postId} />
          </Suspense>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-[calc(var(--nav-h)+2rem)] space-y-5">
            <Suspense fallback={<SidebarPanelSkeleton title="Author" />}>
              <PostAuthor postId={postId} />
            </Suspense>

            <Suspense fallback={<SidebarPanelSkeleton title="Thread map" />}>
              <ThreadMap postId={postId} />
            </Suspense>

            <Suspense
              fallback={<SidebarPanelSkeleton title={`More in #${slug}`} />}
            >
              <RelatedPosts postId={postId} topicSlug={slug} />
            </Suspense>

            <a
              href="#reply"
              className="hidden lg:flex items-center justify-center gap-1.5 w-full h-10 rounded-full border border-rule bg-surface text-sm font-medium text-ink hover:border-ink-2 hover:bg-cream-2/40 transition-colors duration-200 motion-reduce:transition-none"
            >
              <IconReply className="w-4 h-4" />
              Jump to reply
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SidebarPanelSkeleton({ title }: { title: string }) {
  return (
    <SurfacePanel>
      <header className="px-4 py-3 border-b border-rule">
        <h3 className="font-display font-bold text-sm text-ink-3">{title}</h3>
      </header>
      <div className="p-4 space-y-2">
        <div className="h-3 w-2/3 bg-cream-2 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-cream-2 rounded animate-pulse" />
      </div>
    </SurfacePanel>
  );
}
