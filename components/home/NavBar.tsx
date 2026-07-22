import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { NAV_GAP, NAV_IN_TAB, TAB_HEIGHT, TAB_PAD } from '@/lib/home/geometry';
import { SECTION_ORDER, sections, type SectionId } from '@/lib/home/sections';
import type { PanelState } from './HomeExperience';

interface NavBarProps {
  state: PanelState;
  tabTarget: SectionId;
  hovered: SectionId | null;
  active: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
  onHover: (id: SectionId | null) => void;
  onSelect: (id: SectionId) => void;
}

/**
 * The four nav labels, rendered inside the panel's tab row so they ride at
 * panel top + 13 in every state. Publishes --tab-x/--tab-w from measured
 * label boxes so the folder tab hugs whichever label is targeted.
 */
export default function NavBar({
  state,
  tabTarget,
  hovered,
  active,
  rootRef,
  onHover,
  onSelect,
}: NavBarProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<SectionId, HTMLSpanElement>());
  const boxes = useRef(new Map<SectionId, { x: number; w: number }>());
  // Read through a ref so applyTab/measure stay stable and the listeners
  // below register once instead of re-subscribing on every hover change.
  const targetRef = useRef(tabTarget);

  const applyTab = useCallback(() => {
    const root = rootRef.current;
    const box = boxes.current.get(targetRef.current);
    if (!root || !box) return;
    root.style.setProperty('--tab-x', `${box.x - TAB_PAD}px`);
    root.style.setProperty('--tab-w', `${box.w + TAB_PAD * 2}px`);
  }, [rootRef]);

  useEffect(() => {
    targetRef.current = tabTarget;
    applyTab();
  }, [tabTarget, applyTab]);

  const measure = useCallback(() => {
    for (const [id, el] of labelRefs.current) {
      const rect = el.getBoundingClientRect();
      boxes.current.set(id, { x: rect.left, w: rect.width });
    }
    applyTab();
  }, [applyTab]);

  useEffect(() => {
    measure();
    // Signifier loads with display: swap; label widths change when it lands.
    document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    if (rowRef.current) observer.observe(rowRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return (
    <div
      ref={rowRef}
      className="absolute top-0 flex"
      style={{
        left: 'calc(var(--gutter) + var(--inset))',
        columnGap: NAV_GAP,
        paddingTop: NAV_IN_TAB,
      }}
    >
      {SECTION_ORDER.map((id) => {
        const section = sections[id];
        const inTab = state !== 'idle' && tabTarget === id;
        const onSolidTab = active && id === tabTarget;
        return (
          <button
            key={id}
            type="button"
            aria-disabled={!section.activatable || undefined}
            className={cn(
              'pointer-events-auto relative block text-xl leading-[26px] transition-colors duration-200',
              'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
              onSolidTab
                ? 'text-panel-ink'
                : inTab || (active && hovered === id)
                  ? 'text-ink'
                  : 'text-muted',
              section.activatable ? 'cursor-pointer' : 'cursor-default',
            )}
            onPointerEnter={() => onHover(id)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(id)}
          >
            {/* Extends the hitbox over the full folder-tab strip so the
                pointer can travel from label to panel body without dropping
                the preview. Buttons vertically center extra height, so the
                button itself must stay content-sized. */}
            <span
              aria-hidden
              className="absolute inset-x-0"
              style={{ top: -NAV_IN_TAB, height: TAB_HEIGHT }}
            />
            <span
              ref={(el) => {
                if (el) labelRefs.current.set(id, el);
                else labelRefs.current.delete(id);
              }}
            >
              {section.label}
            </span>
            <img
              src={section.underline.src}
              alt=""
              width={section.underline.width}
              height={section.underline.height}
              className={cn(
                'underline-stroke pointer-events-none absolute -left-[3px] top-[23px] max-w-none transition-opacity duration-200',
                onSolidTab ? 'opacity-0' : 'opacity-100',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
