import { NextResponse } from 'next/server';
import { fetchSearchSuggestions } from '@/db/queries/search-suggestions';

export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get('term') ?? '';
  const result = await fetchSearchSuggestions(term);
  return NextResponse.json(result);
}
