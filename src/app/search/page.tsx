import { redirect } from 'next/navigation';
import SearchResults from '@/components/posts/search-results';
import { fetchPostsBySearchTerm } from '@/db/queries/posts';

interface SearchPageProps {
  searchParams: Promise<{
    term: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { term } = await searchParams;

  if (!term) {
    redirect('/');
  }

  const posts = await fetchPostsBySearchTerm(term);
  const count = posts.length;

  return (
    <div className="py-8 sm:py-10">
      <header className="mb-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
          Search results
        </p>
        <h1 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink leading-tight">
          <span className="text-ink-2 font-medium">Results for </span>
          <span className="relative inline-block">
            <span className="relative z-10">&ldquo;{term}&rdquo;</span>
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-0.5 h-3 bg-persimmon-soft -z-0 rounded-sm"
            />
          </span>
        </h1>
        <p className="mt-3 text-sm text-ink-2">
          <span className="font-mono num-plate font-semibold text-ink">
            {count}
          </span>{' '}
          {count === 1 ? 'match' : 'matches'} found
          {count > 0 && ' — sorted by relevance'}
        </p>
      </header>

      <SearchResults posts={posts} />
    </div>
  );
}
