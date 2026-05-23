import { NextResponse } from 'next/server';
import { fetchUserSuggestions } from '@/db/queries/users';
import { getViewerId } from '@/lib/server-utils';

// Lookup for the mention autocomplete dropdown. Requires auth — only
// signed-in users can post or comment, so this is the same gate. We
// return a thin user shape (id / username / name / avatar) suitable
// for the dropdown row layout.
export async function GET(request: Request) {
  const viewerId = await getViewerId();
  if (!viewerId) {
    return NextResponse.json({ users: [] }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get('q') ?? '';
  const users = await fetchUserSuggestions(query);
  return NextResponse.json({ users });
}
