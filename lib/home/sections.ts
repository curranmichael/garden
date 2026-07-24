export type SectionId = 'inspiration' | 'diary' | 'reading' | 'about';

export interface Tile {
  id: string;
  // Future: title, href, media.
}

export interface Section {
  id: SectionId;
  label: string;
  /** Only activatable sections open the panel; the rest preview as a ghost. */
  activatable: boolean;
  tiles: Tile[];
  /** Hand-drawn ink stroke exported from Figma; natural size from its viewBox. */
  underline: { src: string; width: number; height: number };
}

const placeholderTiles = (section: string, count: number): Tile[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${section}-${i + 1}` }));

/** How many Are.na blocks each visit draws into the Inspiration grid. */
export const INSPIRATION_DRAW = 90;

export const SECTION_ORDER: SectionId[] = [
  'inspiration',
  'diary',
  'reading',
  'about',
];

export const sections: Record<SectionId, Section> = {
  inspiration: {
    id: 'inspiration',
    label: 'Inspiration',
    activatable: true,
    tiles: placeholderTiles('inspiration', 20),
    underline: { src: '/underlines/nav-inspiration.svg', width: 102, height: 8 },
  },
  diary: {
    id: 'diary',
    label: 'Diary',
    activatable: true,
    tiles: [],
    underline: { src: '/underlines/nav-diary.svg', width: 57, height: 6 },
  },
  reading: {
    id: 'reading',
    label: 'Reading',
    activatable: false,
    tiles: [],
    underline: { src: '/underlines/nav-reading.svg', width: 80, height: 8 },
  },
  about: {
    id: 'about',
    label: 'About',
    activatable: false,
    tiles: [],
    underline: { src: '/underlines/nav-about.svg', width: 68, height: 7 },
  },
};
