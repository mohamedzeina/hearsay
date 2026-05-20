import { signIn } from '@/auth';
import { db } from '@/db';
import { topicTone } from '@/lib/utils';
import { IconChevronRight } from '@/components/icons';
import Avatar from '@/components/common/avatar';
import GithubSubmitButton from './github-submit-button';

export default async function SignInPage() {
  const [userCount, topicCount, postCount, topTopics, recentUsers] =
    await Promise.all([
      db.user.count(),
      db.topic.count(),
      db.post.count(),
      db.topic.findMany({
        take: 9,
        orderBy: { posts: { _count: 'desc' } },
      }),
      db.user.findMany({
        take: 4,
        select: { id: true, name: true, image: true },
      }),
    ]);

  return (
    <div className="py-10 sm:py-14 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* LEFT: Brand panel */}
        <section className="lg:col-span-7 rise">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2 mb-4">
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-persimmon">
              <span className="absolute inset-0 rounded-full bg-persimmon dot-live" />
            </span>
            Welcome to
          </p>

          <h1 className="font-display font-extrabold text-ink leading-[0.92] tracking-tight text-[clamp(4rem,12vw,9rem)]">
            hearsay
            <span className="text-persimmon">.</span>
          </h1>

          <p className="mt-5 font-display text-2xl sm:text-3xl text-ink-2 leading-snug max-w-xl">
            All opinions{' '}
            <span className="relative inline-block text-ink font-medium">
              <span className="relative z-10">welcome</span>
              <svg
                aria-hidden
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 w-full h-2.5 text-persimmon"
              >
                <path
                  d="M2 6 Q 50 1 100 4 T 198 3"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            . Even <span className="italic text-ink">yours</span>.
          </p>

          <ul className="mt-10 space-y-5 max-w-lg">
            {[
              {
                n: '01',
                t: 'Threaded discussions',
                b: 'Reply, branch, collapse — like a real conversation, not a wall of dunks.',
              },
              {
                n: '02',
                t: 'Topic-driven, not feed-driven',
                b: 'Find rooms for cooking, music, code, politics — anything worth talking about.',
              },
              {
                n: '03',
                t: 'No algorithm',
                b: "Just people, sorted by what's new or what's getting traction.",
              },
            ].map((item) => (
              <li key={item.n} className="flex gap-4 items-start">
                <span className="font-mono text-[11px] text-ink-3 num-plate pt-1.5 w-7 shrink-0">
                  {item.n}
                </span>
                <div className="border-l border-rule pl-4">
                  <p className="font-semibold text-ink leading-tight">
                    {item.t}
                  </p>
                  <p className="mt-1 text-sm text-ink-2 leading-relaxed">
                    {item.b}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {topTopics.length > 0 && (
            <div className="mt-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 mb-3">
                People are talking about
              </p>
              <ul className="flex flex-wrap gap-1.5 max-w-2xl">
                {topTopics.map((t) => {
                  const tone = topicTone(t.slug);
                  return (
                    <li key={t.id}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${tone.dot}`}
                        />
                        <span className="lowercase">{t.slug}</span>
                      </span>
                    </li>
                  );
                })}
                <li>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono text-ink-3 border border-dashed border-rule-2">
                    + {Math.max(0, topicCount - topTopics.length)} more
                  </span>
                </li>
              </ul>
            </div>
          )}
        </section>

        {/* RIGHT: Auth card */}
        <section className="lg:col-span-5 lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
          <div className="relative rounded-3xl border border-rule bg-surface shadow-lift overflow-hidden">
            {/* Top accent */}
            <div className="h-1.5 bg-persimmon" aria-hidden />

            {/* Soft radial bloom */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-40 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 0%, rgba(229, 83, 61, 0.08), transparent 70%)',
              }}
            />

            <div className="relative px-8 py-9">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                Step into the room
              </p>
              <h2 className="font-display font-extrabold text-3xl text-ink leading-tight tracking-tight">
                Sign in
              </h2>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed">
                Hearsay only signs in with GitHub for now. No email, no
                password, no fuss &mdash; just one tap.
              </p>

              <form
                action={async () => {
                  'use server';
                  await signIn('github', { redirectTo: '/' });
                }}
                className="mt-7"
              >
                <GithubSubmitButton />
              </form>

              {/* Why GitHub small note */}
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs text-ink-2 hover:text-persimmon transition-colors duration-200 motion-reduce:transition-none">
                  <IconChevronRight className="w-3 h-3 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                  Why only GitHub?
                </summary>
                <p className="mt-2 pl-4 text-xs text-ink-2 leading-relaxed border-l border-rule">
                  Hearsay is a small community with light moderation. GitHub
                  accounts give us a tiny bit of accountability without
                  collecting your email or asking for a password.
                </p>
              </details>

              {/* Social proof — real user count */}
              {userCount > 0 && (
                <div className="mt-7 pt-6 border-t border-rule flex items-center gap-4">
                  <div className="flex -space-x-1.5 shrink-0">
                    {recentUsers.map((u) => (
                      <Avatar
                        key={u.id}
                        user={u}
                        size="md"
                        ring="surface"
                        tone={topicTone(u.id)}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-ink-2 leading-snug">
                    Join{' '}
                    <span className="font-semibold text-ink num-plate">
                      {userCount.toLocaleString()}
                    </span>{' '}
                    {userCount === 1 ? 'voice' : 'others'} already in the room.
                    <br />
                    <span className="font-mono text-ink-3 text-[10px] uppercase tracking-[0.12em]">
                      {postCount.toLocaleString()} posts &middot;{' '}
                      {topicCount.toLocaleString()} topics
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] font-mono uppercase tracking-[0.18em] text-ink-3">
            <span className="text-persimmon">&bull;</span> by signing in you
            agree to be kind &amp; curious
          </p>
        </section>
      </div>
    </div>
  );
}
