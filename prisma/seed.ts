import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Seeded users share this email domain so we can find and remove them
// on subsequent runs without touching real GitHub-authenticated users.
const SEED_EMAIL_DOMAIN = 'hearsay.dev';

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(seed)}&size=128`;

const SEED_USERS = [
  { handle: 'maya', name: 'Maya Chen' },
  { handle: 'jordan', name: 'Jordan Patel' },
  { handle: 'aiden', name: 'Aiden Park' },
  { handle: 'riley', name: 'Riley Morgan' },
  { handle: 'sasha', name: 'Sasha Volkov' },
  { handle: 'theo', name: 'Theo Nakamura' },
  { handle: 'lin', name: 'Lin Park' },
  { handle: 'kai', name: 'Kai Mendez' },
  { handle: 'nadia', name: 'Nadia Khoury' },
  { handle: 'sam', name: 'Sam Reeves' },
] as const;

async function reset() {
  // Cascades handle most FKs, but explicit order keeps it readable.
  await db.commentVote.deleteMany({});
  await db.postVote.deleteMany({});
  await db.comment.deleteMany({});
  await db.post.deleteMany({});
  await db.topic.deleteMany({});
  await db.user.deleteMany({
    where: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } },
  });
}

async function main() {
  console.log('Resetting all content (preserving real users)...');
  await reset();

  console.log(`Creating ${SEED_USERS.length} personas...`);
  const users = await Promise.all(
    SEED_USERS.map((u) =>
      db.user.create({
        data: {
          name: u.name,
          email: `${u.handle}@${SEED_EMAIL_DOMAIN}`,
          image: avatar(u.handle),
        },
      })
    )
  );
  const byHandle = Object.fromEntries(
    users.map((u, i) => [SEED_USERS[i].handle, u])
  );

  console.log('Creating topics...');
  const [webDev, javascript, career, openSource, design] = await Promise.all([
    db.topic.create({
      data: {
        slug: 'web-dev',
        description:
          'Discuss the latest in web development, frameworks, and best practices',
      },
    }),
    db.topic.create({
      data: {
        slug: 'javascript',
        description:
          'Everything JavaScript — tips, tricks, libraries, and the ecosystem',
      },
    }),
    db.topic.create({
      data: {
        slug: 'career',
        description:
          'Career advice, job hunting, interviews, and growing as a developer',
      },
    }),
    db.topic.create({
      data: {
        slug: 'open-source',
        description:
          'Share and discover open source projects worth contributing to',
      },
    }),
    db.topic.create({
      data: {
        slug: 'design',
        description:
          'UI patterns, design systems, accessibility, and visual craft',
      },
    }),
  ]);

  console.log('Creating posts...');
  const posts = await Promise.all([
    db.post.create({
      data: {
        topicId: webDev.id,
        userId: byHandle.riley.id,
        title: 'Is Next.js the right choice for every project?',
        content:
          "I've been using Next.js for most of my recent projects and I love the DX, but I'm starting to wonder if it's overkill for simpler apps. What's your take — when does it make sense to reach for Next.js vs a lighter alternative like Astro or even plain React?",
      },
    }),
    db.post.create({
      data: {
        topicId: webDev.id,
        userId: byHandle.sasha.id,
        title: 'Tailwind CSS — love it or hate it?',
        content:
          "Tailwind has completely changed how I write CSS. Once you get past the initial learning curve the productivity gains are *real*. The case for it, in three lines:\n\n- **No more naming things.** `card-header-wrapper-inner` is finally dead.\n- **Colocation wins.** The styles live where the markup lives.\n- **Design tokens are cheap.** Override the theme once, the whole app updates.\n\nBut I know a lot of developers find utility classes messy. Would love to hear where people stand on this after using it in production.",
      },
    }),
    db.post.create({
      data: {
        topicId: webDev.id,
        userId: byHandle.aiden.id,
        title: 'What hosting platform do you use for side projects?',
        content:
          "I've been using [Vercel](https://vercel.com) for frontend and [Neon](https://neon.tech) for the database. Works great for Next.js but I'm curious what others are using, especially for more backend-heavy projects.\n\nThe usual suspects:\n\n1. Fly.io — great for persistent processes (websockets, background workers)\n2. Railway — easiest one-click deploys, can get pricey\n3. Render — solid middle ground, good free tier\n4. Self-hosted on a VPS — control vs. ops cost tradeoff\n\nWhat's your go-to stack for deploying side projects without spending much?",
      },
    }),
    db.post.create({
      data: {
        topicId: javascript.id,
        userId: byHandle.kai.id,
        title: 'Why does JavaScript still not have a built-in sleep function?',
        content:
          "I know about `setTimeout` and I know about `async/await` with a Promise wrapper:\n\n```js\nconst sleep = (ms) => new Promise(r => setTimeout(r, ms));\nawait sleep(1000);\n```\n\nBut why, after all these years, is there no native `sleep()` in JS? Coming from Python this still trips me up. Anyone know the *historical* reason behind this design decision?",
      },
    }),
    db.post.create({
      data: {
        topicId: javascript.id,
        userId: byHandle.jordan.id,
        title: 'TypeScript strict mode — is it worth the pain?',
        content:
          "Turned on strict mode in a mid-sized project last week:\n\n```json\n{\n  \"compilerOptions\": {\n    \"strict\": true,\n    \"noUncheckedIndexedAccess\": true\n  }\n}\n```\n\nSpent two days fixing type errors I didn't know existed. **Genuinely caught two real bugs in the process** — both around array access returning `undefined`. Still debating if it's worth enforcing on a team with *mixed* TypeScript experience. What do you all think?",
      },
    }),
    db.post.create({
      data: {
        topicId: career.id,
        userId: byHandle.sam.id,
        title: 'How do you prepare for system design interviews?',
        content:
          "Got a few system design rounds coming up and I'm honestly not sure how to prepare. I have a decent grasp of distributed systems concepts but translating that into a 45-minute interview format is a different skill. Looking for resources, frameworks, or personal tips from people who've been through it.",
      },
    }),
    db.post.create({
      data: {
        topicId: career.id,
        userId: byHandle.lin.id,
        title: 'How important is an online presence as a developer?',
        content:
          "I've been debating whether to invest time into building a portfolio site, writing blog posts, and being more active on GitHub vs just focusing on getting better at actual engineering. Is a strong online presence a real career differentiator or is it mostly noise?",
      },
    }),
    db.post.create({
      data: {
        topicId: openSource.id,
        userId: byHandle.theo.id,
        title: "Share your favourite open source project you've contributed to",
        content:
          "I made my first open source contribution last month — fixed a small documentation bug in a popular React library. It felt surprisingly rewarding. I'd love to hear from others about projects they've contributed to and what the experience was like. Any beginner-friendly repos you'd recommend?",
      },
    }),
    db.post.create({
      data: {
        topicId: openSource.id,
        userId: byHandle.nadia.id,
        title: 'Maintainer burnout is real — how do you keep going?',
        content:
          "I've been maintaining a mid-popularity OSS library for three years. Issues pile up, the few sponsors barely cover hosting, and lately I've been resenting opening the repo.\n\n> The work that pays nothing is the work that drains the most.\n\nCurious how other maintainers handle the long-term emotional load. What's worked for *you*?",
      },
    }),
    db.post.create({
      data: {
        topicId: design.id,
        userId: byHandle.maya.id,
        title: 'When do design systems become a tax instead of a force multiplier?',
        content:
          "We rolled out a design system 18 months ago and it's been mostly great. But lately every small product change requires a design-system PR first, and velocity has stalled. Where's the line between consistency and creativity, in your experience?",
      },
    }),
    db.post.create({
      data: {
        topicId: design.id,
        userId: byHandle.sasha.id,
        title: 'Why is dark mode still so hard to get right?',
        content:
          "Built three apps with dark mode in the last year and each time the contrast and hierarchy fall apart in subtle ways. Curious whether others have a design process or set of guardrails that actually leads to a dark theme that feels intentional rather than inverted.",
      },
    }),
  ]);

  console.log('Creating comment threads...');

  // posts[0] — Next.js
  const p0c0 = await db.comment.create({
    data: {
      postId: posts[0].id,
      userId: byHandle.maya.id,
      content:
        'Totally agree — Next.js is fantastic but sometimes Astro is the right call, especially for content-heavy sites where you want minimal JS by default.',
    },
  });
  await db.comment.create({
    data: {
      postId: posts[0].id,
      parentId: p0c0.id,
      userId: byHandle.kai.id,
      content:
        'Good point on Astro. I used it for a marketing site and the zero-JS-by-default approach was a game changer for Lighthouse scores.',
    },
  });
  await db.comment.create({
    data: {
      postId: posts[0].id,
      parentId: p0c0.id,
      userId: byHandle.jordan.id,
      content:
        'Agreed — but once you need any interactivity on that marketing site, you end up adding islands anyway and the gap closes.',
    },
  });
  const p0c1 = await db.comment.create({
    data: {
      postId: posts[0].id,
      userId: byHandle.theo.id,
      content:
        'The App Router changed things for me. Once I got used to Server Components I stopped questioning it — it handles so much complexity for you.',
    },
  });
  await db.comment.create({
    data: {
      postId: posts[0].id,
      parentId: p0c1.id,
      userId: byHandle.nadia.id,
      content:
        'Same. The mental model is different but once it clicks, going back to the Pages Router feels like a step backwards.',
    },
  });

  // posts[1] — Tailwind
  const p1c0 = await db.comment.create({
    data: {
      postId: posts[1].id,
      userId: byHandle.lin.id,
      content:
        'Tailwind advocate here. The key insight is that you stop context-switching between files. Everything is colocated and that alone is worth it.',
    },
  });
  await db.comment.create({
    data: {
      postId: posts[1].id,
      parentId: p1c0.id,
      userId: byHandle.maya.id,
      content:
        'Exactly. And with the VS Code extension showing you the actual CSS on hover, the readability concern basically disappears.',
    },
  });
  await db.comment.create({
    data: {
      postId: posts[1].id,
      userId: byHandle.sam.id,
      content:
        "Coming from BEM, the class soup felt wrong at first. Three months in I can't imagine going back.",
    },
  });

  // posts[2] — Hosting
  await db.comment.create({
    data: {
      postId: posts[2].id,
      userId: byHandle.theo.id,
      content:
        "**Vercel + Neon** is my go-to as well. Neon's branching feature is underrated — great for testing schema changes without touching prod. One command:\n\n```bash\nneonctl branches create --name feature/add-votes\n```\n\nAnd you've got an isolated DB pointed at the same data.",
    },
  });
  await db.comment.create({
    data: {
      postId: posts[2].id,
      userId: byHandle.aiden.id,
      content:
        "Fly.io for anything with persistent processes (websockets, queues). Vercel's serverless model can get pricey under load.",
    },
  });

  // posts[3] — JS sleep
  const p3c0 = await db.comment.create({
    data: {
      postId: posts[3].id,
      userId: byHandle.nadia.id,
      content:
        "It's a browser environment thing — blocking the main thread would freeze the UI. The event loop model makes a blocking sleep fundamentally incompatible with how the runtime works.",
    },
  });
  await db.comment.create({
    data: {
      postId: posts[3].id,
      parentId: p3c0.id,
      userId: byHandle.jordan.id,
      content:
        "Right, and Node.js inherited the same model. The Promise-based workaround is pretty clean once you get used to it:\n\n```js\nawait new Promise(r => setTimeout(r, 1000));\n```\n\nReads almost like the imperative version.",
    },
  });

  // posts[4] — TS strict
  await db.comment.create({
    data: {
      postId: posts[4].id,
      userId: byHandle.maya.id,
      content:
        "Strict mode is **100% worth it**. The pain is upfront, the safety is forever. I'd never start a new project without it.\n\nAlso recommend enabling these two right out of the gate:\n\n- `noUncheckedIndexedAccess`\n- `exactOptionalPropertyTypes`",
    },
  });
  await db.comment.create({
    data: {
      postId: posts[4].id,
      userId: byHandle.kai.id,
      content:
        'Counterpoint as someone learning TS — strict mode taught me more about types in a week than the docs did in a month. Painful but worth it.',
    },
  });

  // posts[5] — System design
  await db.comment.create({
    data: {
      postId: posts[5].id,
      userId: byHandle.nadia.id,
      content:
        'The "Grokking System Design" course helped me a lot. Also practice drawing diagrams out loud — interviewers care a lot about how you communicate tradeoffs.',
    },
  });

  // posts[6] — Online presence
  await db.comment.create({
    data: {
      postId: posts[6].id,
      userId: byHandle.theo.id,
      content:
        'A good GitHub profile alone has gotten me recruiter attention. Projects with a live demo and a clean README make a real difference.',
    },
  });
  await db.comment.create({
    data: {
      postId: posts[6].id,
      userId: byHandle.riley.id,
      content:
        "Counterpoint: I have zero online presence and still get great roles. What actually matters is your network and being able to talk through your work concretely.",
    },
  });

  // posts[8] — Maintainer burnout
  const p8c0 = await db.comment.create({
    data: {
      postId: posts[8].id,
      userId: byHandle.theo.id,
      content:
        "Solidarity. The honest answer that worked for me: declare a maintenance schedule (e.g. one weekend a month), and let everything else wait. Users adapt.",
    },
  });
  await db.comment.create({
    data: {
      postId: posts[8].id,
      parentId: p8c0.id,
      userId: byHandle.nadia.id,
      content:
        'This is the way. The implicit expectation that maintainers are on-call 24/7 is the root problem. Setting boundaries openly is part of the project.',
    },
  });

  // posts[9] — Design system tax
  await db.comment.create({
    data: {
      postId: posts[9].id,
      userId: byHandle.sasha.id,
      content:
        "We hit the same wall. The fix was creating an 'experiment' tier — components that live outside the system for 3 months before being promoted. Velocity came back.",
    },
  });

  // posts[10] — Dark mode
  await db.comment.create({
    data: {
      postId: posts[10].id,
      userId: byHandle.maya.id,
      content:
        "I treat dark mode as a separate design pass, not a token swap. Different shadow strategy, different contrast hierarchy. Inverted palettes always look off.",
    },
  });

  console.log('Sprinkling votes...');

  // Deterministic-ish PRNG so reruns look similar.
  let s = 42;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pick = <T,>(arr: readonly T[], n: number): T[] => {
    const out: T[] = [];
    const pool = [...arr];
    for (let i = 0; i < n && pool.length > 0; i++) {
      out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
    return out;
  };

  for (const post of posts) {
    const voters = pick(users, 2 + Math.floor(rand() * 5)); // 2–6 votes
    for (const voter of voters) {
      await db.postVote.create({
        data: { userId: voter.id, postId: post.id },
      });
    }
  }

  const allComments = await db.comment.findMany({ select: { id: true } });
  for (const c of allComments) {
    const voters = pick(users, Math.floor(rand() * 4)); // 0–3 votes
    for (const voter of voters) {
      await db.commentVote.create({
        data: { userId: voter.id, commentId: c.id },
      });
    }
  }

  const stats = {
    users: users.length,
    topics: 5,
    posts: posts.length,
    comments: allComments.length,
    postVotes: await db.postVote.count(),
    commentVotes: await db.commentVote.count(),
  };
  console.log('Seeding complete:', stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
