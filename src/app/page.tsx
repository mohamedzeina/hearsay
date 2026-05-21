import Link from 'next/link';
import TopicCreateForm from '@/components/topics/topic-create-form';
import TopicList from '@/components/topics/topic-list';
import { fetchRecentPosts } from '@/db/queries/posts';
import PostFeed from '@/components/posts/post-feed';
import SurfacePanel from '@/components/common/surface-panel';
import { auth } from '@/auth';
import { db } from '@/db';

export default async function Home() {
  const session = await auth();

  const [posts, postCount, topicCount, userCount] = await Promise.all([
    fetchRecentPosts(),
    db.post.count(),
    db.topic.count(),
    db.user.count(),
  ]);

  return (
    <div className="py-8 sm:py-10">
      {!session?.user ? (
        <SignedOutHero
          postCount={postCount}
          topicCount={topicCount}
          userCount={userCount}
        />
      ) : (
        <SignedInGreeting
          name={session.user.name ?? 'friend'}
          postCount={postCount}
          topicCount={topicCount}
          userCount={userCount}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        <div id="feed" className="lg:col-span-8">
          <PostFeed posts={posts} />
        </div>
        <aside className="lg:col-span-4">
          <div className="sticky top-[calc(var(--nav-h)+2rem)] space-y-5">
            <SidebarPanel
              title="Start something"
              hint="Create a topic"
              tone="persimmon"
            >
              <TopicCreateForm />
            </SidebarPanel>

            <SidebarPanel
              title="Browse topics"
              hint={`${topicCount} active`}
            >
              <TopicList />
            </SidebarPanel>

            <CommunityNote />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SignedOutHero({
  postCount,
  topicCount,
  userCount,
}: {
  postCount: number;
  topicCount: number;
  userCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-rule bg-surface shadow-soft rise">
      {/* Soft radial background blooms */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 0%, rgba(229, 83, 61, 0.10), transparent 50%), radial-gradient(circle at 100% 100%, rgba(15, 110, 100, 0.08), transparent 55%)',
        }}
      />

      <div className="relative px-6 sm:px-10 py-10 sm:py-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-persimmon-soft text-persimmon-deep px-3 py-1 text-xs font-semibold border border-persimmon/15">
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-persimmon">
            <span className="absolute inset-0 rounded-full bg-persimmon dot-live" />
          </span>
          {userCount} {userCount === 1 ? 'voice' : 'voices'} and counting
        </div>

        <h1 className="mt-5 font-display font-extrabold tracking-tight text-ink text-4xl sm:text-5xl md:text-6xl leading-[1.02] max-w-2xl">
          Conversations{' '}
          <span className="relative inline-block">
            <span className="relative z-10">that go somewhere</span>
            <svg
              aria-hidden
              viewBox="0 0 300 12"
              preserveAspectRatio="none"
              className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3 text-persimmon"
            >
              <path
                d="M3 8 Q 75 1 150 6 T 297 4"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
          .
        </h1>

        <p className="mt-5 max-w-lg text-base sm:text-lg text-ink-2 leading-relaxed">
          Ask hard questions, share half-formed thoughts, and read what people
          are actually saying. Hearsay is a small community for the stuff
          worth talking about.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/auth/signin"
            className="group inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon active:scale-[0.98] transition-all duration-200 motion-reduce:transition-none shadow-soft"
          >
            Join the conversation
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              &rarr;
            </span>
          </Link>
          <a
            href="#feed"
            className="inline-flex items-center gap-1.5 px-4 h-11 rounded-full border border-rule bg-surface text-ink text-sm font-medium hover:border-ink-2 transition-colors duration-200 motion-reduce:transition-none"
          >
            <span>Read the room first</span>
            <span aria-hidden>&darr;</span>
          </a>
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative grid grid-cols-3 border-t border-rule bg-cream-2/40 divide-x divide-rule">
        <HeroStat label="posts" value={postCount} />
        <HeroStat label="topics" value={topicCount} />
        <HeroStat label="members" value={userCount} />
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-ink-2">
        {label}
      </span>
      <span className="font-display font-bold text-2xl sm:text-3xl text-ink num-plate leading-none">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function SignedInGreeting({
  name,
  postCount,
  topicCount,
  userCount,
}: {
  name: string;
  postCount: number;
  topicCount: number;
  userCount: number;
}) {
  const firstName = name.split(' ')[0];
  const hour = new Date().getHours();
  const tod = hour < 5 ? 'late' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <section className="rise flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rule bg-surface px-5 sm:px-6 py-4 shadow-soft">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
          Good {tod}
        </p>
        <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold text-ink mt-0.5 leading-tight">
          Welcome back, {firstName}.
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-sm">
        <Pill label="posts" value={postCount} />
        <Pill label="topics" value={topicCount} />
        <Pill label="members" value={userCount} hideOnMobile />
      </div>
    </section>
  );
}

function Pill({
  label,
  value,
  hideOnMobile,
}: {
  label: string;
  value: number;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-baseline gap-1.5 rounded-full bg-cream-2 px-3 py-1.5 ${
        hideOnMobile ? 'hidden sm:inline-flex' : ''
      }`}
    >
      <span className="font-display font-bold text-ink num-plate">
        {value.toLocaleString()}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
        {label}
      </span>
    </div>
  );
}

function SidebarPanel({
  title,
  hint,
  tone,
  children,
}: {
  title: string;
  hint?: string;
  tone?: 'persimmon';
  children: React.ReactNode;
}) {
  return (
    <SurfacePanel as="section">
      <header className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              tone === 'persimmon' ? 'bg-persimmon' : 'bg-ink-3'
            }`}
          />
          <h2 className="font-display font-bold text-sm text-ink">{title}</h2>
        </div>
        {hint && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
            {hint}
          </span>
        )}
      </header>
      <hr className="border-0 h-px bg-rule" />
      <div className="p-4">{children}</div>
    </SurfacePanel>
  );
}

function CommunityNote() {
  return (
    <div className="rounded-2xl bg-cream-2/60 border border-rule px-4 py-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 mb-1">
        House rules
      </p>
      <p className="text-sm text-ink-2 leading-relaxed">
        Be kind. Be curious. Disagree with the idea, not the person.
      </p>
    </div>
  );
}
