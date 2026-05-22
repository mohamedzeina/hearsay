interface CharCounterProps {
  current: number;
  min: number;
  max: number;
}

// Surfaces the live char count + the relevant boundary so users don't
// hit "post failed" on submit. Three visual states:
// - below min: "min N to post" hint in ink-3
// - in range, under 90% of max: muted "current / max" in ink-3
// - within 10% of max OR over: persimmon-deep
export default function CharCounter({ current, min, max }: CharCounterProps) {
  const belowMin = current > 0 && current < min;
  const empty = current === 0;
  const near = current >= max * 0.9;

  const fmt = (n: number) => n.toLocaleString('en-US');

  const tone = near ? 'text-persimmon-deep' : 'text-ink-3';

  let body: string;
  if (empty) {
    body = `min ${fmt(min)}`;
  } else if (belowMin) {
    body = `min ${fmt(min)} to post`;
  } else {
    body = `${fmt(current)} / ${fmt(max)}`;
  }

  return (
    <p
      className={`font-mono text-[10px] uppercase tracking-[0.12em] ${tone} tabular-nums`}
      aria-live="polite"
    >
      {body}
    </p>
  );
}
