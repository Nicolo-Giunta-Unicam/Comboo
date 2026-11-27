// Crea dist/comboo.html: un unico file giocabile (utile per itch.io o per condividere).
import { readFileSync, writeFileSync } from 'node:fs';
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
// nel file unico gli sfondi di arena (dist/backgrounds/...) vengono incorporati come data URI
const game = readFileSync('dist/game.js', 'utf8').replace(/dist\/backgrounds\/([^"?]+)\?v=[0-9a-f]+/g, (_, f) => `data:${MIME[f.split('.').pop().toLowerCase()]};base64,${readFileSync('dist/backgrounds/' + f).toString('base64')}`);
const html = readFileSync('index.html', 'utf8').replace('<link rel="manifest" href="manifest.webmanifest">', '').replace(/<script src="dist\/game\.js[^"]*"><\/script>/, () => `<script>${game}</script>`);
writeFileSync('dist/comboo.html', html); console.log('dist/comboo.html');
