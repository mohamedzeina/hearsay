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
	// Spread joined-on dates across the past ~3 years so profile pages show
	// realistic variety instead of "everyone joined just now".
	const joinAnchor = Date.now();
	const monthMs = 30 * 24 * 60 * 60 * 1000;
	const joinSpread = [36, 30, 24, 18, 14, 10, 7, 4, 2, 0.5] as const;
	const users = await Promise.all(
		SEED_USERS.map((u, i) =>
			db.user.create({
				data: {
					name: u.name,
					username: u.handle,
					email: `${u.handle}@${SEED_EMAIL_DOMAIN}`,
					image: avatar(u.handle),
					createdAt: new Date(joinAnchor - joinSpread[i] * monthMs),
				},
			}),
		),
	);
	// Non-persona users (real GitHub accounts that pre-date the username column)
	// are intentionally left with username = null. The events.signIn callback in
	// src/auth.ts backfills them with their real `profile.login` on next signin,
	// which is better than slugifying their display name.
	const byHandle = Object.fromEntries(
		users.map((u, i) => [SEED_USERS[i].handle, u]),
	);

	console.log('Creating topics...');
	const [
		webDev,
		javascript,
		career,
		openSource,
		design,
		food,
		books,
		travel,
		music,
		fitness,
		gaming,
	] = await Promise.all([
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
		db.topic.create({
			data: {
				slug: 'food',
				description: 'Home cooking, recipes, restaurants, and everything tasty',
			},
		}),
		db.topic.create({
			data: {
				slug: 'books',
				description: 'Book recommendations, reviews, and reading habits',
			},
		}),
		db.topic.create({
			data: {
				slug: 'travel',
				description:
					'Trip ideas, destinations, and the logistics of getting there',
			},
		}),
		db.topic.create({
			data: {
				slug: 'music',
				description: 'Albums, gear, discovery, and how you actually listen',
			},
		}),
		db.topic.create({
			data: {
				slug: 'fitness',
				description:
					'Running, lifting, yoga, recovery — everything that gets you moving',
			},
		}),
		db.topic.create({
			data: {
				slug: 'gaming',
				description:
					'Games, hardware, and fitting them into a real-life schedule',
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
					'Tailwind has completely changed how I write CSS. Once you get past the initial learning curve the productivity gains are *real*. The case for it, in three lines:\n\n- **No more naming things.** `card-header-wrapper-inner` is finally dead.\n- **Colocation wins.** The styles live where the markup lives.\n- **Design tokens are cheap.** Override the theme once, the whole app updates.\n\nBut I know a lot of developers find utility classes messy. Would love to hear where people stand on this after using it in production.',
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
					'I know about `setTimeout` and I know about `async/await` with a Promise wrapper:\n\n```js\nconst sleep = (ms) => new Promise(r => setTimeout(r, ms));\nawait sleep(1000);\n```\n\nBut why, after all these years, is there no native `sleep()` in JS? Coming from Python this still trips me up. Anyone know the *historical* reason behind this design decision?',
			},
		}),
		db.post.create({
			data: {
				topicId: javascript.id,
				userId: byHandle.jordan.id,
				title: 'TypeScript strict mode — is it worth the pain?',
				content:
					'Turned on strict mode in a mid-sized project last week:\n\n```json\n{\n  "compilerOptions": {\n    "strict": true,\n    "noUncheckedIndexedAccess": true\n  }\n}\n```\n\nSpent two days fixing type errors I didn\'t know existed. **Genuinely caught two real bugs in the process** — both around array access returning `undefined`. Still debating if it\'s worth enforcing on a team with *mixed* TypeScript experience. What do you all think?',
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
				title:
					'When do design systems become a tax instead of a force multiplier?',
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
					'Built three apps with dark mode in the last year and each time the contrast and hierarchy fall apart in subtle ways. Curious whether others have a design process or set of guardrails that actually leads to a dark theme that feels intentional rather than inverted.',
			},
		}),
		db.post.create({
			data: {
				topicId: food.id,
				userId: byHandle.maya.id,
				title: "What's your weeknight dinner formula?",
				content:
					"I've fallen into the trap of cooking the same three meals on rotation. Trying to figure out a *formula* I can mix and match instead of memorising new recipes every week.\n\nMy current attempt:\n\n- A protein (rotating chicken, tofu, eggs, lentils)\n- A grain or carb\n- A green vegetable\n- A sauce that ties it all together\n\nThe sauce is what's saving me — peanut, tahini-lemon, salsa verde, miso-butter. What's your go-to weeknight pattern?",
			},
		}),
		db.post.create({
			data: {
				topicId: books.id,
				userId: byHandle.jordan.id,
				title: 'Stopped reading three books in a row — am I being too picky?',
				content:
					"Genuinely worried I'm becoming impatient as a reader. The last three books I picked up, I bailed on around the 60-page mark. Each one was *fine* — just not pulling me in.\n\nDo you push through when a book isn't grabbing you, or just move on? Life feels too short for books you're not enjoying, but I also wonder if I'm missing the slow burns.",
			},
		}),
		db.post.create({
			data: {
				topicId: travel.id,
				userId: byHandle.aiden.id,
				title: 'Solo trips have a 3-day sweet spot for me — anyone else?',
				content:
					'Just got back from a solo week in Lisbon. The first three days were amazing — wandering, eating, no schedule. By day five I was honestly bored of my own company.\n\nIs three days the limit for everyone, or am I just bad at being alone? Curious what your sweet spot is for solo travel.',
			},
		}),
		db.post.create({
			data: {
				topicId: music.id,
				userId: byHandle.riley.id,
				title: 'How do you actually find new music in 2026?',
				content:
					"Spotify's recommendations have started feeling like a hall of mirrors — same five artists in every mix. I miss the days of a friend handing me a USB stick.\n\nWhat's working for you? Newsletters? Bandcamp? A specific radio show? I'll take anything that isn't another algorithm.",
			},
		}),
		db.post.create({
			data: {
				topicId: fitness.id,
				userId: byHandle.sasha.id,
				title:
					'Coming back to running after 2 years — start from zero or pick up where I left off?',
				content:
					"I used to run 30km a week pretty comfortably. Then life happened and I haven't laced up in two years.\n\nMy instinct is to do 5km easy and see how it feels. Everyone I've asked says *no*, walk-run for a month first. The ego wants to skip ahead. The knees want to listen.\n\nWhat would you do?",
			},
		}),
		db.post.create({
			data: {
				topicId: gaming.id,
				userId: byHandle.theo.id,
				title: 'Steam Deck vs gaming PC — which one actually gets played more?',
				content:
					"I built a nice gaming PC three years ago. Then I got a Steam Deck. The PC has barely been on in months.\n\nTurns out 'I can play it on the couch' beats 'it looks slightly better' every single time. Anyone else gone all-in on handheld and not looked back?",
			},
		}),
		db.post.create({
			data: {
				topicId: food.id,
				userId: byHandle.lin.id,
				title:
					'Home espresso rabbit hole — worth it, or just buy good beans and a V60?',
				content:
					"I'm one click away from spending way too much on an espresso setup. My partner thinks I've lost the plot and that a pour-over with great beans is 90% of the experience for 10% of the cost.\n\nThey're probably right. But the *probably* is doing a lot of work in that sentence. Talk me out of it, or into it.",
			},
		}),
		db.post.create({
			data: {
				topicId: books.id,
				userId: byHandle.kai.id,
				title:
					'Anyone else re-reading old favourites instead of starting new ones?',
				content:
					"I noticed I've been going back to books I've already read three or four times. There's something comforting about knowing exactly how it's going to feel.\n\nIs this a sign I'm in a reading rut, or is re-reading underrated? I almost feel guilty about it, like I should be *making progress* through my TBR pile.",
			},
		}),
		db.post.create({
			data: {
				topicId: travel.id,
				userId: byHandle.nadia.id,
				title:
					'Slow travel converted me — a month in one city beats three cities in a week',
				content:
					"Spent four weeks in Mexico City instead of rushing across the country, and it's changed how I want to travel forever.\n\nYou learn the actual neighbourhood. You go back to the same cafe twice. You stop optimising. Anyone else made the switch? Where would you stay for a month?",
			},
		}),
		db.post.create({
			data: {
				topicId: music.id,
				userId: byHandle.sam.id,
				title: 'Concerts have gotten weirdly expensive — is it just me?',
				content:
					"Saw a show last weekend and the ticket plus fees was almost £90 for an artist I'd never have paid £40 for two years ago. I get that touring is the income now, but the calculus has shifted enough that I'm choosing fewer, bigger shows over the smaller venues I used to love.\n\nAm I just getting older or has something fundamentally changed?",
			},
		}),
	]);

	// Preserved real user (a real GitHub-authenticated account, if any). When
	// present we mix in posts and comments authored by them so the seed reflects
	// the actual owner of the dev DB, not just the seeded personas.
	const realUsers = await db.user.findMany({
		where: { email: { not: { endsWith: `@${SEED_EMAIL_DOMAIN}` } } },
		orderBy: { id: 'asc' },
	});
	const owner = realUsers[0] ?? null;

	let ownerFoodPost: { id: string } | null = null;
	let ownerCareerPost: { id: string } | null = null;
	if (owner) {
		console.log(`Adding posts by ${owner.name ?? owner.email}...`);
		ownerFoodPost = await db.post.create({
			data: {
				topicId: food.id,
				userId: owner.id,
				title: "Best thing you've cooked lately?",
				content:
					"Spent way too long this weekend chasing a perfect roasted whole cauliflower — turmeric, tahini, pomegranate. Absolutely worth the time.\n\nWhat's been your standout home cook of the month?",
			},
		});
		ownerCareerPost = await db.post.create({
			data: {
				topicId: career.id,
				userId: owner.id,
				title: "What's one habit that's quietly made you a better engineer?",
				content:
					"Not the big rewrites or hot takes — the boring small habits.\n\nFor me it's writing a one-paragraph summary at the end of every coding session. Sounds tiny; saves an hour of re-discovery the next morning.\n\nWhat's yours?",
			},
		});
	}

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
				'Right, and Node.js inherited the same model. The Promise-based workaround is pretty clean once you get used to it:\n\n```js\nawait new Promise(r => setTimeout(r, 1000));\n```\n\nReads almost like the imperative version.',
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
				'Counterpoint: I have zero online presence and still get great roles. What actually matters is your network and being able to talk through your work concretely.',
		},
	});

	// posts[8] — Maintainer burnout
	const p8c0 = await db.comment.create({
		data: {
			postId: posts[8].id,
			userId: byHandle.theo.id,
			content:
				'Solidarity. The honest answer that worked for me: declare a maintenance schedule (e.g. one weekend a month), and let everything else wait. Users adapt.',
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
				'I treat dark mode as a separate design pass, not a token swap. Different shadow strategy, different contrast hierarchy. Inverted palettes always look off.',
		},
	});

	// posts[11] — Weeknight dinner formula
	const p11c0 = await db.comment.create({
		data: {
			postId: posts[11].id,
			userId: byHandle.jordan.id,
			content:
				'The sauce angle is real. I keep about four jars going in the fridge at all times and dinner basically writes itself.',
		},
	});
	await db.comment.create({
		data: {
			postId: posts[11].id,
			parentId: p11c0.id,
			userId: byHandle.aiden.id,
			content: 'Which four? I have peanut sauce and... a lot of mustard.',
		},
	});

	// posts[12] — DNF books
	await db.comment.create({
		data: {
			postId: posts[12].id,
			userId: byHandle.theo.id,
			content:
				"I've stopped feeling guilty about it. The publishing world produces way more than anyone can read — being picky is the only sane response.",
		},
	});

	// posts[13] — Solo trip sweet spot
	await db.comment.create({
		data: {
			postId: posts[13].id,
			userId: byHandle.nadia.id,
			content:
				"I get the opposite — three days isn't enough to settle in anywhere. Try a week somewhere walkable and see if it shifts.",
		},
	});
	await db.comment.create({
		data: {
			postId: posts[13].id,
			userId: byHandle.maya.id,
			content:
				'Three days for me too. After that I want someone to share the meals with.',
		},
	});

	// posts[14] — Finding new music
	await db.comment.create({
		data: {
			postId: posts[14].id,
			userId: byHandle.sasha.id,
			content:
				'Bandcamp Daily and a couple of Substack newsletters do all the heavy lifting for me now. The algorithms gave up on me.',
		},
	});
	await db.comment.create({
		data: {
			postId: posts[14].id,
			userId: byHandle.kai.id,
			content:
				"Genuinely just texting friends 'what are you listening to'. Not scalable but the hit rate is so much higher.",
		},
	});

	// posts[15] — Returning to running
	const p15c0 = await db.comment.create({
		data: {
			postId: posts[15].id,
			userId: byHandle.aiden.id,
			content:
				"Walk-run. Your cardio comes back in weeks, your tendons take *months*. Don't ask me how I know.",
		},
	});
	await db.comment.create({
		data: {
			postId: posts[15].id,
			parentId: p15c0.id,
			userId: byHandle.maya.id,
			content:
				'Co-signed. The first injury after a long break is always the dumb, avoidable one.',
		},
	});

	// posts[16] — Steam Deck vs PC
	await db.comment.create({
		data: {
			postId: posts[16].id,
			userId: byHandle.riley.id,
			content:
				'Same exact arc. The PC is a glorified emulator host now. Comfort wins every time.',
		},
	});

	// posts[17] — Home espresso
	await db.comment.create({
		data: {
			postId: posts[17].id,
			userId: byHandle.sam.id,
			content:
				'I went down this exact hole. Honestly? Get a good grinder, any half-decent machine, and great beans. The grinder is what actually matters.',
		},
	});
	await db.comment.create({
		data: {
			postId: posts[17].id,
			userId: byHandle.kai.id,
			content:
				"Don't do it. Buy a V60, save the money, drink better beans more often.",
		},
	});

	// posts[18] — Re-reading books
	const p18c0 = await db.comment.create({
		data: {
			postId: posts[18].id,
			userId: byHandle.lin.id,
			content:
				'Re-reading is one of the best things about reading. You notice everything you missed the first time.',
		},
	});
	await db.comment.create({
		data: {
			postId: posts[18].id,
			parentId: p18c0.id,
			userId: byHandle.jordan.id,
			content:
				"Also it's how you find out which books actually held up. Half of mine didn't.",
		},
	});

	// posts[19] — Slow travel
	await db.comment.create({
		data: {
			postId: posts[19].id,
			userId: byHandle.theo.id,
			content:
				"A month in Tbilisi was the best travel I've done. Cheap, walkable, and you get a 'usual cafe' by week two.",
		},
	});

	// posts[20] — Concert prices
	await db.comment.create({
		data: {
			postId: posts[20].id,
			userId: byHandle.riley.id,
			content:
				"Not just you. Fees alone have gone unhinged. I now budget for two big shows a year and that's it.",
		},
	});
	await db.comment.create({
		data: {
			postId: posts[20].id,
			userId: byHandle.nadia.id,
			content:
				"Smaller venues are where the magic still is, and they're holding the line on prices. Worth chasing them out.",
		},
	});

	if (owner) {
		console.log(`Adding comments by ${owner.name ?? owner.email}...`);

		// Owner chiming in on a few existing threads
		await db.comment.create({
			data: {
				postId: posts[1].id,
				userId: owner.id,
				content:
					"Tailwind convert here too. The 'where did I define that class' problem disappeared overnight.",
			},
		});
		await db.comment.create({
			data: {
				postId: posts[11].id,
				userId: owner.id,
				content:
					'Sauce-as-strategy is the way. A good tahini-lemon will rescue a Tuesday on its own.',
			},
		});
		await db.comment.create({
			data: {
				postId: posts[15].id,
				userId: owner.id,
				content: "Walk-run, no question. Cardio comes back fast, joints don't.",
			},
		});
		await db.comment.create({
			data: {
				postId: posts[20].id,
				userId: owner.id,
				content:
					'Switched to one big show plus smaller local venues. Way better ratio per pound.',
			},
		});

		// Personas responding to the owner's posts so they're not orphaned
		if (ownerFoodPost) {
			await db.comment.create({
				data: {
					postId: ownerFoodPost.id,
					userId: byHandle.maya.id,
					content:
						'Roasted cauliflower never disappoints. I do harissa-yogurt instead of tahini when I want a change of pace.',
				},
			});
		}
		if (ownerCareerPost) {
			await db.comment.create({
				data: {
					postId: ownerCareerPost.id,
					userId: byHandle.theo.id,
					content:
						"Love this. The end-of-session note habit has saved me on every project I've actually shipped.",
				},
			});
		}
	}

	console.log('Marking a few rows as edited...');
	const now = Date.now();
	const minutesAgo = (n: number) => new Date(now - n * 60 * 1000);
	const hoursAgo = (n: number) => new Date(now - n * 60 * 60 * 1000);
	const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

	await db.post.update({
		where: { id: posts[4].id },
		data: { editedAt: hoursAgo(2) },
	});
	await db.post.update({
		where: { id: posts[15].id },
		data: { editedAt: daysAgo(6) },
	});
	await db.comment.update({
		where: { id: p0c0.id },
		data: { editedAt: minutesAgo(10) },
	});
	await db.comment.update({
		where: { id: p8c0.id },
		data: { editedAt: daysAgo(3) },
	});
	await db.comment.update({
		where: { id: p15c0.id },
		data: { editedAt: daysAgo(1) },
	});

	console.log('Sprinkling votes...');

	// Deterministic-ish PRNG so reruns look similar.
	let s = 42;
	const rand = () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
	const pick = <T>(arr: readonly T[], n: number): T[] => {
		const out: T[] = [];
		const pool = [...arr];
		for (let i = 0; i < n && pool.length > 0; i++) {
			out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
		}
		return out;
	};

	const voterPool = owner ? [...users, owner] : users;
	const allPosts = [
		...posts,
		...(ownerFoodPost ? [ownerFoodPost] : []),
		...(ownerCareerPost ? [ownerCareerPost] : []),
	];

	for (const post of allPosts) {
		const voters = pick(voterPool, 2 + Math.floor(rand() * 5)); // 2–6 votes
		for (const voter of voters) {
			await db.postVote.create({
				data: { userId: voter.id, postId: post.id },
			});
		}
	}

	const allComments = await db.comment.findMany({ select: { id: true } });
	for (const c of allComments) {
		const voters = pick(voterPool, Math.floor(rand() * 4)); // 0–3 votes
		for (const voter of voters) {
			await db.commentVote.create({
				data: { userId: voter.id, commentId: c.id },
			});
		}
	}

	const stats = {
		users: users.length + (owner ? 1 : 0),
		topics: 11,
		posts: allPosts.length,
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
