import type { RefObject } from 'react';
import { cn } from '@/lib/cn';
import { GRID_HEAD, TAB_HEIGHT } from '@/lib/home/geometry';
import type { Tile as TileSlot } from '@/lib/home/sections';
import type { PanelState, TileBlocks } from './HomeExperience';
import Tile from './Tile';

interface TileGridProps {
  tiles: TileSlot[];
  blocks: TileBlocks;
  state: PanelState;
  gridRef: RefObject<HTMLDivElement | null>;
}

/** Tile grid inside the panel body; translated by --grid-y after the dock. */
export default function TileGrid({
  tiles,
  blocks,
  state,
  gridRef,
}: TileGridProps) {
  return (
    <div
      ref={gridRef}
      className={cn(
        'grid gap-5 px-5 pb-5 transition-opacity duration-200 will-change-transform',
        state === 'idle'
          ? 'opacity-0'
          : state === 'preview'
            ? 'opacity-20'
            : 'opacity-100',
      )}
      style={{
        gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))',
        paddingTop: GRID_HEAD - TAB_HEIGHT,
        transform: 'translateY(var(--grid-y))',
      }}
    >
      {tiles.map((tile, i) => (
        <Tile key={tile.id} block={blocks?.[i] ?? null} />
      ))}
    </div>
  );
}
