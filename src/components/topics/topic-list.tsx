import Link from 'next/link';
import paths from '@/paths';
import { topicTone } from '@/lib/utils';
import { fetchAllTopicsByActivity } from '@/db/queries/topics';

export default async function TopicList() {
  const topics = await fetchAllTopicsByActivity();

  if (topics.length === 0) {
    return (
      <p className="text-sm text-ink-2 italic">No topics yet — start one above.</p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {topics.map((topic) => {
        const tone = topicTone(topic.slug);
        const count = topic._count.posts;
        return (
          <li key={topic.id}>
            <Link
              href={paths.topicShow(topic.slug)}
              className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text} hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transition-none`}
              title={`${count} ${count === 1 ? 'post' : 'posts'} in #${topic.slug}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              <span className="lowercase">{topic.slug}</span>
              {count > 0 && (
                <span className="font-mono num-plate opacity-60 group-hover:opacity-90 transition-opacity duration-200 motion-reduce:transition-none">
                  · {count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
