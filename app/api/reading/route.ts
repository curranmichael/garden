import { NextResponse } from 'next/server';
import { getBooks } from '@/lib/goodreads';

// Always re-evaluated, but the Goodreads fetches underneath are cached for
// an hour, so this touches their feed at most hourly per shelf.
export const dynamic = 'force-dynamic';

export async function GET() {
  const books = await getBooks();
  return NextResponse.json(books);
}
