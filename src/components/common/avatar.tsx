import Image from 'next/image';
import type { topicTone } from '@/lib/utils';

interface AvatarUser {
  name?: string | null;
  image?: string | null;
}

interface AvatarProps {
  user: AvatarUser;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ring?: 'rule' | 'surface' | 'none';
  tone?: ReturnType<typeof topicTone>;
  className?: string;
}

const SIZES = {
  xs: { px: 20, box: 'w-5 h-5', text: 'text-[10px]' },
  sm: { px: 24, box: 'w-6 h-6', text: 'text-[10px]' },
  md: { px: 32, box: 'w-8 h-8', text: 'text-xs' },
  lg: { px: 48, box: 'w-12 h-12', text: 'text-base' },
} as const;

const RINGS = {
  rule: 'ring-1 ring-rule',
  surface: 'ring-2 ring-surface',
  none: '',
} as const;

export default function Avatar({
  user,
  size = 'md',
  ring = 'rule',
  tone,
  className = '',
}: AvatarProps) {
  const s = SIZES[size];
  const ringClass = RINGS[ring];
  const name = user.name?.trim() ?? '';

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={name}
        width={s.px}
        height={s.px}
        className={`${s.box} rounded-full object-cover ${ringClass} ${className}`.trim()}
      />
    );
  }

  const initial = name[0]?.toUpperCase() ?? '?';
  const fallback = tone
    ? `${tone.bg} ${tone.text}`
    : 'bg-persimmon-soft text-persimmon-deep';

  return (
    <span
      className={`${s.box} ${s.text} ${ringClass} ${fallback} font-semibold rounded-full inline-flex items-center justify-center shrink-0 ${className}`.trim()}
    >
      {initial}
    </span>
  );
}
