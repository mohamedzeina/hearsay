import PostCreateForm from '@/components/posts/post-create-form';
import PostList from '@/components/posts/post-list';
import { fetchPostByTopicSlug } from '@/db/queries/posts';
import { db } from '@/db';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/common/breadcrumb';
import { topicTone } from '@/lib/utils';

interface TopicShowPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TopicShowPage({ params }: TopicShowPageProps) {
  const { slug } = await params;

  const topic = await db.topic.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  });

  if (!topic) notFound();

  const tone = topicTone(slug);
  const postCount = topic._count.posts;

  return (
    <div className="py-8 sm:py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: slug }]} />

      <header
        className={`relative overflow-hidden rounded-3xl border border-rule shadow-soft rise ${tone.bg}`}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.7), transparent 55%), radial-gradient(circle at 100% 100%, rgba(26,22,20,0.06), transparent 55%)',
          }}
        />

        <div className="relative px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-surface/70 backdrop-blur px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] ${tone.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              topic
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-surface/70 backdrop-blur px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] ${tone.text}`}
            >
              <span className="font-semibold num-plate">{postCount}</span>
              {postCount === 1 ? 'post' : 'posts'}
            </span>
          </div>

          <h1
            className={`font-display font-extrabold tracking-tight leading-[1.05] text-4xl sm:text-5xl lowercase ${tone.text}`}
          >
            <span className="opacity-60">#</span>
            {slug}
          </h1>

          {topic.description && (
            <p className={`mt-3 max-w-2xl text-base sm:text-lg leading-relaxed ${tone.text} opacity-85`}>
              {topic.description}
            </p>
          )}
        </div>
      </header>

      <div className="lg:hidden mt-6">
        <PostCreateForm slug={slug} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-[1.7rem] text-ink leading-tight tracking-tight">
                Posts in <span className="lowercase">{slug}</span>
              </h2>
              <p className="mt-0.5 text-sm text-ink-2">
                {postCount === 0
                  ? 'No posts yet — kick it off.'
                  : `${postCount} ${postCount === 1 ? 'post' : 'posts'} in this room`}
              </p>
            </div>
          </div>

          <PostList
            fetchData={() => fetchPostByTopicSlug(slug)}
            hideTopic
            emptyMessage={`No posts in #${slug} yet — be the first to start one.`}
          />
        </div>

        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-[calc(var(--nav-h)+2rem)] space-y-5">
            <div className="rounded-2xl border border-rule bg-surface shadow-soft p-5">
              <h3 className="font-display font-bold text-sm text-ink mb-1">
                Got something to say?
              </h3>
              <p className="text-xs text-ink-2 mb-4 leading-relaxed">
                Drop a question, hot take, or half-formed thought into{' '}
                <span className={`font-medium ${tone.text}`}>#{slug}</span>.
              </p>
              <PostCreateForm slug={slug} />
            </div>

            <div className="rounded-2xl bg-cream-2/60 border border-rule px-4 py-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 mb-1">
                Quick tips
              </p>
              <ul className="text-sm text-ink-2 leading-relaxed list-disc pl-4 space-y-0.5 marker:text-persimmon">
                <li>Use a clear title</li>
                <li>Share context, not just the question</li>
                <li>Be specific so people can help</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
