import type { RefObject } from 'react';
import { cn } from '@/lib/cn';
import { TAB_HEIGHT } from '@/lib/home/geometry';
import { sections, type SectionId } from '@/lib/home/sections';
import type { PanelState, TileBlocks } from './HomeExperience';
import NavBar from './NavBar';
import TileGrid from './TileGrid';

interface PanelProps {
  state: PanelState;
  tabTarget: SectionId;
  hovered: SectionId | null;
  active: boolean;
  blocks: TileBlocks;
  rootRef: RefObject<HTMLDivElement | null>;
  gridRef: RefObject<HTMLDivElement | null>;
  onHover: (id: SectionId | null) => void;
  onSelect: (id: SectionId) => void;
}

/**
 * The folder-tab panel. One wrapper rides --panel-top (never transitioned);
 * the tab + body chrome live in a single opacity group so the ghost state
 * has no seam where the shapes overlap.
 */
export default function Panel({
  state,
  tabTarget,
  hovered,
  active,
  blocks,
  rootRef,
  gridRef,
  onHover,
  onSelect,
}: PanelProps) {
  const surface = state === 'active' ? 'bg-panel' : 'bg-tile';
  const bodyBox = {
    top: TAB_HEIGHT,
    left: 'var(--gutter)',
    right: 'var(--gutter)',
    height: '100dvh',
  } as const;

  return (
    <div
      className="absolute inset-x-0 top-0 z-20 h-dvh will-change-transform"
      style={{ transform: 'translateY(var(--panel-top))' }}
    >
      {/* Dark scrim across the tab row so the bio dims as it passes behind
          the nav (per the Figma scroll frames). Invisible against the page
          at rest; only needed once the panel is solid. */}
      <div
        className={cn(
          'absolute rounded-t-[4px] bg-page/75 transition-opacity duration-200',
          active ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          top: 0,
          left: 'var(--gutter)',
          right: 'var(--gutter)',
          height: TAB_HEIGHT,
        }}
      />
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-200',
          state === 'idle'
            ? 'opacity-0'
            : state === 'preview'
              ? 'opacity-20'
              : 'opacity-100',
          active && 'pointer-events-auto',
        )}
      >
        <div
          className={cn('absolute left-0 top-0 rounded-t-[4px]', surface)}
          style={{
            // Overlaps the body by 4px to hide the seam; same fill, and the
            // group opacity flattens both, so the ghost stays uniform.
            height: TAB_HEIGHT + 4,
            width: 'var(--tab-w)',
            transform: 'translateX(var(--tab-x))',
            transitionProperty: 'transform, width, background-color',
            transitionDuration: '250ms',
          }}
        />
        <div
          className={cn(
            'absolute rounded-[4px] transition-colors duration-200',
            surface,
          )}
          style={bodyBox}
        />
      </div>
      <NavBar
        state={state}
        tabTarget={tabTarget}
        hovered={hovered}
        active={active}
        rootRef={rootRef}
        onHover={onHover}
        onSelect={onSelect}
      />
      <div
        className={cn(
          'absolute overflow-hidden rounded-[4px]',
          active && 'pointer-events-auto',
        )}
        style={bodyBox}
      >
        <TileGrid
          tiles={sections[tabTarget].tiles}
          blocks={tabTarget === 'inspiration' ? blocks : null}
          state={state}
          gridRef={gridRef}
        />
      </div>
    </div>
  );
}
