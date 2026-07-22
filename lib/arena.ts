import 'server-only';

import { shuffle } from '@/lib/shuffle';

/**
 * Are.na v3 data layer for the Inspiration tiles.
 * Reads the user's public + closed channels and pools their image-bearing
 * blocks. Private channels are always excluded. Every failure path degrades
 * to a smaller (possibly empty) pool — this module never throws.
 */

const ARENA_API = 'https://api.are.na/v3';
const ARENA_USER = 'curran-dwyer';
const PER = 100;
const MAX_CHANNEL_PAGES = 3;
// The whole pool ships in the page payload so the client can sample per
// visit; 3× the 20-tile grid keeps variety without bloating the HTML.
const POOL_CAP = 60;
const CONCURRENCY = 5;

export interface InspirationBlock {
  id: number;
  imgUrl: string;
  alt: string;
  /** The block's original source URL, else its are.na permalink. */
  blockUrl: string;
  channelTitle: string;
  channelUrl: string;
}

interface ArenaPage<T> {
  meta?: { has_more_pages?: boolean };
  data?: T[];
}

interface ArenaChannel {
  id: number;
  slug: string;
  title: string;
  visibility?: 'public' | 'closed' | 'private' | string;
  owner?: { slug?: string };
}

interface ArenaItem {
  id: number;
  base_type?: string;
  title?: string | null;
  source?: { url?: string | null } | null;
  image?: {
    alt_text?: string | null;
    src?: string;
    small?: { src?: string; src_2x?: string };
  } | null;
}

async function arenaFetch<T>(path: string): Promise<T | null> {
  const token = process.env.ARENA_ACCESS_TOKEN;
  try {
    const res = await fetch(`${ARENA_API}${path}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchVisibleChannels(): Promise<ArenaChannel[]> {
  const channels: ArenaChannel[] = [];
  for (let page = 1; page <= MAX_CHANNEL_PAGES; page++) {
    const res = await arenaFetch<ArenaPage<ArenaChannel>>(
      `/users/${ARENA_USER}/contents?type=Channel&per=${PER}&page=${page}`,
    );
    if (!res?.data) break;
    channels.push(...res.data);
    if (!res.meta?.has_more_pages) break;
  }
  return channels.filter(
    (channel) =>
      channel.visibility === 'public' || channel.visibility === 'closed',
  );
}

function toBlock(
  item: ArenaItem,
  channel: ArenaChannel,
): InspirationBlock | null {
  if (item.base_type !== 'Block') return null;
  const image = item.image;
  const imgUrl = image?.small?.src_2x ?? image?.small?.src ?? image?.src;
  if (!imgUrl) return null;
  return {
    id: item.id,
    imgUrl,
    alt: image?.alt_text ?? item.title ?? '',
    blockUrl: item.source?.url ?? `https://www.are.na/block/${item.id}`,
    channelTitle: channel.title,
    channelUrl: `https://www.are.na/${channel.owner?.slug ?? ARENA_USER}/${channel.slug}`,
  };
}

export async function getInspirationPool(): Promise<InspirationBlock[]> {
  try {
    const channels = await fetchVisibleChannels();
    const byId = new Map<number, InspirationBlock>();
    for (let i = 0; i < channels.length; i += CONCURRENCY) {
      const batch = channels.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (channel) => ({
          channel,
          items:
            (
              await arenaFetch<ArenaPage<ArenaItem>>(
                `/channels/${channel.id}/contents?per=${PER}`,
              )
            )?.data ?? [],
        })),
      );
      for (const { channel, items } of results) {
        for (const item of items) {
          const block = toBlock(item, channel);
          if (block && !byId.has(block.id)) byId.set(block.id, block);
        }
      }
    }
    return shuffle([...byId.values()]).slice(0, POOL_CAP);
  } catch {
    return [];
  }
}
