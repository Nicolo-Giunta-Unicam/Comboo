// Legge le immagini in assets/ e genera src/assets.generated.ts (data URI). Nome file = chiave (vedi assets/README.md).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
mkdirSync('assets', { recursive: true }); const out = {};
for (const f of readdirSync('assets')) { const e = extname(f).toLowerCase(); if (MIME[e]) out[basename(f, extname(f))] = `data:${MIME[e]};base64,${readFileSync('assets/' + f).toString('base64')}`; }
writeFileSync('src/assets.generated.ts', `// GENERATO da scripts/build-assets.mjs: non modificare.\nexport const ASSETS: Record<string, string> = ${JSON.stringify(out, null, 1)};\n`);
console.log(`${Object.keys(out).length} immagini personalizzate`);
