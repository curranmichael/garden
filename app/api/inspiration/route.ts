import { NextResponse } from 'next/server';
import { getInspirationBlocks } from '@/lib/arena';
import { INSPIRATION_DRAW } from '@/lib/home/sections';
import { shuffle } from '@/lib/shuffle';

// A fresh random draw per request; the Are.na fetches underneath are cached
// for an hour, so this touches their API at most hourly per endpoint.
export const dynamic = 'force-dynamic';

export async function GET() {
  const all = await getInspirationBlocks();
  const draw = shuffle([...all]).slice(0, INSPIRATION_DRAW);
  return NextResponse.json(draw, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
