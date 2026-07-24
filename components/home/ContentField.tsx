import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { sections, type SectionId } from '@/lib/home/sections';
import DiaryList from './DiaryList';
import type { TileBlocks } from './HomeExperience';
import ProgressiveBlur from './ProgressiveBlur';
import Tile from './Tile';

/**
 * The content surface from the Garden-2 Figma: opening a section washes
 * the scene's right side with a progressive blur, then floats the
 * section's content over it. Closing reverses the order — content leaves
 * first, the veil lifts after. Scrolling happens inside this layer; the
 * page never moves.
 *
 * Geometry (from the 1280x832 frame, anchored to center like the poppy):
 * veil from 50%-250px, columns from 50%-81px, 40px gaps, 50px margins.
 */
export default function ContentField({
  active,
  blocks,
}: {
  active: SectionId | null;
  blocks: TileBlocks;
}) {
  // Holds the last open section while fading out, so the content doesn't
  // vanish mid-transition.
  const lastRef = useRef<SectionId>('inspiration');
  const shown = active ?? lastRef.current;
  if (shown !== lastRef.current) lastRef.current = shown;

  const scrollRef = useRef<HTMLDivElement>(null);
  // A section always opens at its top, including swaps between sections.
  useEffect(() => {
    if (active) scrollRef.current?.scrollTo(0, 0);
  }, [active]);

  const open = active !== null;

  return (
    <>
      <ProgressiveBlur
        direction="to right"
        maxBlur={40}
        ramp={0.55}
        visible={open}
        className={cn(
          'absolute inset-y-0 right-0 z-[14]',
          open ? 'delay-0' : 'delay-150',
        )}
        style={{ left: 'calc(50% - 250px)' }}
      />
      <div
        ref={scrollRef}
        inert={!open}
        className={cn(
          'no-scrollbar absolute inset-y-0 right-[50px] z-[15] overflow-y-auto overscroll-contain py-[50px]',
          'transition-[opacity,transform] ease-out',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100 delay-[250ms] duration-[450ms]'
            : 'translate-y-2 opacity-0 delay-0 duration-[250ms]',
        )}
        style={{ left: 'calc(50% - 81px)' }}
      >
        {shown === 'diary' ? (
          // -mt-4 cancels the first row's padding so the diary opens on
          // the same optical line the tiles do.
          <div className="-mt-4">
            <DiaryList ghost />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-10">
            {blocks?.length
              ? blocks.map((block) => <Tile key={block.id} block={block} />)
              : sections.inspiration.tiles.map((tile) => (
                  <Tile key={tile.id} block={null} />
                ))}
          </div>
        )}
      </div>
    </>
  );
}
