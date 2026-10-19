// Crea dist/comboo.html: un unico file giocabile (utile per itch.io o per condividere).
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8').replace('<link rel="manifest" href="manifest.webmanifest">', '').replace('<script src="dist/game.js"></script>', () => `<script>${readFileSync('dist/game.js', 'utf8')}</script>`);
writeFileSync('dist/comboo.html', html); console.log('dist/comboo.html');
