# Design system

One source of truth — [`design-system.json`](./design-system.json) — compiled into the CSS token layer by a tiny generator. Components reference **semantic tokens** (`text-foreground`, `bg-muted`, …), never raw palette steps, so they port across projects unchanged even if the underlying palette differs.

## How it flows

```
design-system.json  ──(scripts/build-tokens.mjs)──>  app/tokens.css  ──(imported by)──>  app/globals.css
```

`app/tokens.css` is **generated** — never edit it by hand. The generator runs automatically on `predev` and `prebuild` (so local `npm run dev`/`build` and Vercel deploys always reflect the manifest), or on demand:

```bash
npm run tokens
```

## Semantic tokens

Reference these in components (e.g. `bg-background`, `text-muted-foreground`, `border-border`, `ring-ring`, `text-accent`). Each maps onto a Radix **sand** step (or a literal, for the accent); the light/dark values switch automatically via `next-themes` toggling `.dark` on `<html>`.

| Token              | Maps to    | Role                       |
| ------------------ | ---------- | -------------------------- |
| `background`       | sand‑1     | page background            |
| `surface`          | sand‑2     | raised / card background   |
| `muted`            | sand‑3     | subtle fills / hover       |
| `border`           | sand‑6     | borders / dividers         |
| `ring`             | sand‑8     | focus ring                 |
| `muted-foreground` | sand‑11    | secondary text             |
| `foreground`       | sand‑12    | primary text               |
| `accent`           | `#f37021`  | brand accent (birkin)      |

The raw `sand-1…12` utilities are still exposed as an escape hatch, but **prefer the semantic names** — they're what makes a component portable.

## Changing the look

- **Re‑theme everything**: change `color.scale` in the manifest (e.g. `"sand"` → `"slate"`), swap the two `@radix-ui/colors/<scale>.css` imports in `app/globals.css`, run `npm run tokens`. Every component follows.
- **Re‑map a role**: edit a `semantic` entry's `ref` (e.g. point `muted-foreground` at `sand-10`).
- **Accent**: edit `semantic.accent.value`.

## Fonts

Söhne (`font-sans`) and Signifier (`font-serif`), loaded via `next/font/local` in [`lib/fonts.ts`](./lib/fonts.ts) from `public/fonts/*.woff2`. Weights, German weight names, and **license provenance** (Klim orders) are recorded in the manifest. Note: licensed `.woff2` only — never the watermarked `Test*`/trial files.

## Adopting this in another repo (e.g. enai-website)

This is the "stop diverging" mechanism. In the target project:

1. `npm i @radix-ui/colors`
2. Copy `design-system.json` + `scripts/build-tokens.mjs`, add the `tokens`/`predev`/`prebuild` scripts to `package.json`.
3. In `globals.css`: import `tailwindcss`, the two `@radix-ui/colors/<scale>` files, and `./tokens.css`; add `@custom-variant dark (&:is(.dark *))`.
4. Run `npm run tokens`. Components written against the semantic tokens now render identically.

> Until this is extracted into a shared package, both repos hold a copy of these two files. Keeping them byte‑identical is the contract; a published `@curran/tokens` package (or a monorepo) would remove the copy — see the maintainer.
