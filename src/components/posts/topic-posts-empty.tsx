import { IconReply } from '@/components/icons';
import PostCreateForm from './post-create-form';

interface TopicPostsEmptyProps {
  slug: string;
}

export default function TopicPostsEmpty({ slug }: TopicPostsEmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 sm:px-10 py-12 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-persimmon-soft mb-4">
        <IconReply strokeWidth={1.8} className="w-6 h-6 text-persimmon-deep" />
      </div>
      <h3 className="font-display font-bold text-lg text-ink tracking-tight">
        Start the discussion in{' '}
        <span className="lowercase">#{slug}</span>
      </h3>
      <p className="mt-1.5 text-sm text-ink-2 max-w-md mx-auto leading-relaxed">
        No posts in <span className="lowercase">#{slug}</span> yet. Drop the
        first one — a question, a hot take, or a half-formed thought.
      </p>
      <div className="mt-6 max-w-xs mx-auto">
        <PostCreateForm slug={slug} />
      </div>
    </div>
  );
}
