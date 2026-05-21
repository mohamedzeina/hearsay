import Link from 'next/link';
import paths from '@/paths';
import { resolveAuthorSlug } from '@/lib/utils';

interface AuthorNameProps {
  user: { name: string | null; username?: string | null };
  className?: string;
  fallback?: string;
}

export default function AuthorName({
  user,
  className,
  fallback = 'anon',
}: AuthorNameProps) {
  const display = user.name ?? fallback;
  const slug = resolveAuthorSlug(user);

  if (!slug) {
    return <span className={className}>{display}</span>;
  }

  return (
    <Link href={paths.userProfile(slug)} className={className}>
      {display}
    </Link>
  );
}
