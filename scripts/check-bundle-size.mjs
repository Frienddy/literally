// Enforces the app-code bundle-size budget (PRD-011 R11-8, PRD-000 NFR-3).
//
// NFR-3 targets "< ~200KB gzipped app code (excl. fonts/icons)". This script
// measures the gzipped size of every JS chunk the browser downloads for the app
// (everything under dist/assets/*.js — the main bundle plus lazy chunks and the
// workbox-window glue) and fails the build if the total exceeds the budget.
// Service-worker runtime (dist/sw.js, dist/workbox-*.js) and precached media are
// PWA plumbing, not app code, so they sit outside this gate.
//
// Zero dependencies (uses node:zlib) so it runs in CI without an install step
// beyond the app's own. Run after `npm run build`:
//   npm run build && npm run check:size
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS_DIR = join(ROOT, 'dist', 'assets');

// The contract from NFR-3. Kept generous on purpose: it is a regression *ceiling*,
// not a target. Tighten it deliberately (and note it here) if the budget shrinks.
const BUDGET_GZIP_BYTES = 200 * 1024;

const kb = (bytes) => (bytes / 1024).toFixed(2) + ' KB';

if (!existsSync(ASSETS_DIR)) {
  console.error(
    `✗ No build found at ${ASSETS_DIR}.\n  Run \`npm run build\` before \`npm run check:size\`.`,
  );
  process.exit(1);
}

const jsFiles = readdirSync(ASSETS_DIR)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const raw = readFileSync(join(ASSETS_DIR, name));
    return { name, raw: raw.length, gzip: gzipSync(raw).length };
  })
  .sort((a, b) => b.gzip - a.gzip);

if (jsFiles.length === 0) {
  console.error(
    `✗ No JS chunks found in ${ASSETS_DIR}. Did the build succeed?`,
  );
  process.exit(1);
}

const totalGzip = jsFiles.reduce((sum, f) => sum + f.gzip, 0);

const nameWidth = Math.max(
  ...jsFiles.map((f) => f.name.length),
  'chunk'.length,
);
const pad = (s) => s.padEnd(nameWidth);
console.log(`\n  ${pad('chunk')}   raw        gzip`);
console.log(`  ${'-'.repeat(nameWidth)}   ---------  ---------`);
for (const f of jsFiles) {
  console.log(
    `  ${pad(f.name)}   ${kb(f.raw).padStart(9)}  ${kb(f.gzip).padStart(9)}`,
  );
}
console.log(`  ${'-'.repeat(nameWidth)}   ---------  ---------`);
console.log(
  `  ${pad('total app JS')}              ${kb(totalGzip).padStart(9)}`,
);
console.log(
  `  budget (NFR-3):              ${kb(BUDGET_GZIP_BYTES).padStart(9)}`,
);

if (totalGzip > BUDGET_GZIP_BYTES) {
  console.error(
    `\n✗ Bundle over budget by ${kb(totalGzip - BUDGET_GZIP_BYTES)} ` +
      `(${kb(totalGzip)} > ${kb(BUDGET_GZIP_BYTES)}).`,
  );
  process.exit(1);
}

const headroom = BUDGET_GZIP_BYTES - totalGzip;
const used = ((totalGzip / BUDGET_GZIP_BYTES) * 100).toFixed(1);
console.log(
  `\n✓ Within budget: ${kb(totalGzip)} of ${kb(BUDGET_GZIP_BYTES)} ` +
    `(${used}% used, ${kb(headroom)} headroom).\n`,
);
