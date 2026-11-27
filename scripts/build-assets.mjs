// Legge le immagini in assets/ e genera src/assets.generated.ts (data URI). Nome file = chiave (vedi assets/README.md).
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, extname } from 'node:path';
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
mkdirSync('assets', { recursive: true }); const out = {};
for (const f of readdirSync('assets')) { const e = extname(f).toLowerCase(); if (MIME[e]) out[basename(f, extname(f))] = `data:${MIME[e]};base64,${readFileSync('assets/' + f).toString('base64')}`; }
// Sfondi per arena: assets/backgrounds/<menu|duel>-<id arena>.<ext>. Restano file separati (copiati in dist/backgrounds/, caricati solo quando servono) per non appesantire game.js.
const BG = {}; rmSync('dist/backgrounds', { recursive: true, force: true });
if (existsSync('assets/backgrounds')) for (const f of readdirSync('assets/backgrounds')) {
  const m = /^(menu|duel)-([a-z0-9_-]+)\.(png|jpe?g|webp|gif|svg)$/i.exec(f); if (!m) continue;
  mkdirSync('dist/backgrounds', { recursive: true }); copyFileSync('assets/backgrounds/' + f, 'dist/backgrounds/' + f);
  BG[`${m[1]}-${m[2]}`.toLowerCase()] = `dist/backgrounds/${f}?v=${createHash('md5').update(readFileSync('assets/backgrounds/' + f)).digest('hex').slice(0, 8)}`; // ?v= cambia al cambiare il file: niente cache vecchia
}
writeFileSync('src/assets.generated.ts', `// GENERATO da scripts/build-assets.mjs: non modificare.\nexport const ASSETS: Record<string, string> = ${JSON.stringify(out, null, 1)};\n// Sfondi per arena (file separati in dist/backgrounds/): chiave "menu-<arena>" o "duel-<arena>".\nexport const BACKGROUNDS: Record<string, string> = ${JSON.stringify(BG, null, 1)};\n`);
console.log(`${Object.keys(out).length} immagini personalizzate, ${Object.keys(BG).length} sfondi di arena`);
