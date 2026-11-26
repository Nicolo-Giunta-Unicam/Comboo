import { test } from 'node:test'; import assert from 'node:assert/strict';
import { TRACKS, trackProblems } from '../src/audio'; import { REGION_LIST } from '../src/regions';
// Brani a tema per arena: i dati musicali devono essere coerenti (8 accordi, 8 battute da 8 crome, pattern da 16, note nel registro).
test('musica: tutti i brani a tema sono scritti correttamente', () => { assert.deepEqual(trackProblems(), []); });
test('musica: ogni arena ha il suo brano per lo store (calm) e ogni arena tranne la prima anche il suo duello (la prima usa il tema originale)', () => {
  const ids = REGION_LIST.map(r => r.id); assert.ok(ids.length >= 6);
  for (const id of ids) { assert.ok(TRACKS[id], `manca il tema di ${id}`); assert.ok(TRACKS[id].calm, `manca il calm di ${id}`); if (id !== ids[0]) assert.ok(TRACKS[id].combat, `manca il combat di ${id}`); }
  for (const id of Object.keys(TRACKS)) assert.ok(ids.includes(id), `tema per un'arena inesistente: ${id}`);
});
