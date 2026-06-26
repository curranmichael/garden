#!/usr/bin/env node
// Compiles design-system.json -> app/tokens.css (the Tailwind v4 token layer).
// Dependency-free. Run via `npm run tokens`; also runs automatically on predev/prebuild.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ds = JSON.parse(readFileSync(resolve(root, 'design-system.json'), 'utf8'));

const { scale, raw, semantic } = ds.color;
const out = [];
out.push('/* GENERATED from design-system.json by scripts/build-tokens.mjs — do not edit by hand. */');
out.push('');

// Literal, mode-aware semantic values (e.g. the brand accent, which has no Radix step).
const lightVars = [];
const darkVars = [];
for (const [name, def] of Object.entries(semantic)) {
  if (def.value) {
    lightVars.push(`  --${name}: ${def.value.light};`);
    darkVars.push(`  --${name}: ${def.value.dark};`);
  }
}
if (lightVars.length) {
  out.push(':root {', ...lightVars, '}');
  out.push('.dark {', ...darkVars, '}');
  out.push('');
}

// Tailwind theme mapping. `inline` so var() references resolve through the
// Radix light/dark cascade at runtime (i.e. dark mode just works).
out.push('@theme inline {');
if (raw?.exposeScale) {
  out.push(`  /* raw ${scale} scale (escape hatch — prefer the semantic tokens below) */`);
  for (let i = 1; i <= (raw.steps ?? 12); i++) {
    out.push(`  --color-${scale}-${i}: var(--${scale}-${i});`);
  }
}
out.push('  /* semantic tokens — reference these in components */');
for (const [name, def] of Object.entries(semantic)) {
  const target = def.ref ? `var(--${def.ref})` : `var(--${name})`;
  out.push(`  --color-${name}: ${target};`);
}
out.push('  /* fonts */');
for (const font of Object.values(ds.fonts)) {
  out.push(`  --${font.role}: var(${font.var});`);
}
out.push('}');
out.push('');

writeFileSync(resolve(root, 'app/tokens.css'), out.join('\n'));
console.log('✓ app/tokens.css generated from design-system.json');
