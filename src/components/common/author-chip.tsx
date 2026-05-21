'use client';

import { useRouter } from 'next/navigation';
import Avatar from '@/components/common/avatar';
import paths from '@/paths';
import { resolveAuthorSlug } from '@/lib/utils';

interface AuthorChipProps {
  user: { name: string | null; image: string | null; username?: string | null };
}

/**
 * Author attribution that's safe to render inside an outer <Link> wrapper.
 * Renders as a <button> instead of an <a> to avoid the invalid nested-anchor
 * pattern; intercepts the click so the parent card link doesn't fire.
 */
export default function AuthorChip({ user }: AuthorChipProps) {
  const router = useRouter();
  const slug = resolveAuthorSlug(user);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (slug) router.push(paths.userProfile(slug));
  };

  const inner = (
    <>
      <Avatar user={user} size="xs" />
      <span
        className={`font-medium text-ink ${
          slug
            ? 'group-hover/author:text-persimmon transition-colors duration-150 motion-reduce:transition-none'
            : ''
        }`}
      >
        {user.name ?? 'anon'}
      </span>
    </>
  );

  if (!slug) {
    return <span className="inline-flex items-center gap-1.5">{inner}</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group/author inline-flex items-center gap-1.5 rounded-full -mx-1 px-1 py-0.5 hover:bg-cream-2/60 transition-colors duration-150 motion-reduce:transition-none"
      aria-label={`View ${user.name ?? 'profile'}'s profile`}
    >
      {inner}
    </button>
  );
}
