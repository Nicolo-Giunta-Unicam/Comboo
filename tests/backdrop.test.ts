import { test } from 'node:test'; import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path'; import { spawnSync } from 'node:child_process';
// Sfondi per arena: assets/backgrounds/<menu|duel>-<arena>.<ext> viene copiato in dist/backgrounds/ e registrato in BACKGROUNDS; i file con nome non valido sono ignorati.
test('sfondi di arena: build-assets copia solo i file con nome valido e li registra', () => {
  const dir = mkdtempSync(join(tmpdir(), 'comboo-bg-')); mkdirSync(join(dir, 'assets/backgrounds'), { recursive: true }); mkdirSync(join(dir, 'src'));
  for (const f of ['menu-ocean.jpg', 'duel-ocean.WEBP', 'duel-volcano.png', 'README.md', 'ocean.png', 'menu-ocean.txt', 'fight-ocean.png']) writeFileSync(join(dir, 'assets/backgrounds', f), 'x');
  const r = spawnSync('node', [resolve('scripts/build-assets.mjs')], { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr);
  const gen = readFileSync(join(dir, 'src/assets.generated.ts'), 'utf8'), bg = JSON.parse(gen.slice(gen.indexOf('BACKGROUNDS: Record<string, string> = ') + 38, gen.lastIndexOf('};') + 1)) as Record<string, string>;
  assert.deepEqual(Object.keys(bg).sort(), ['duel-ocean', 'duel-volcano', 'menu-ocean']);
  assert.match(bg['menu-ocean'], /^dist\/backgrounds\/menu-ocean\.jpg\?v=[0-9a-f]{8}$/); assert.match(bg['duel-ocean'], /^dist\/backgrounds\/duel-ocean\.WEBP\?v=/);
  for (const f of ['menu-ocean.jpg', 'duel-ocean.WEBP', 'duel-volcano.png']) assert.ok(existsSync(join(dir, 'dist/backgrounds', f)), f);
  for (const f of ['README.md', 'ocean.png', 'menu-ocean.txt', 'fight-ocean.png']) assert.ok(!existsSync(join(dir, 'dist/backgrounds', f)), f + ' non va copiato');
});
test('sfondi di arena: senza cartella o senza file non succede nulla (BACKGROUNDS vuoto)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'comboo-bg-')); mkdirSync(join(dir, 'src'));
  const r = spawnSync('node', [resolve('scripts/build-assets.mjs')], { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(join(dir, 'src/assets.generated.ts'), 'utf8'), /BACKGROUNDS: Record<string, string> = \{\};/); assert.ok(!existsSync(join(dir, 'dist/backgrounds')));
});
