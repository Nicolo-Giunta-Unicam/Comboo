import { test } from 'node:test'; import assert from 'node:assert/strict';
import { clone, renameId, addRename, renameScript, validate, imageKeyList, moveCard, newMove, dupMove, deleteMove, findMove, choicePts, allMoves } from '../src/editor-data';
import { forEachText, localize, BUNDLED, type GameData } from '../src/gamedata'; import { paletteVars } from '../src/theme';
const fresh = () => clone(BUNDLED) as GameData & Record<string, any>;
test('dati inclusi: nessun errore di validazione', () => { assert.deepEqual(validate(fresh()).filter(i => i.level === 'err'), []); });
test('rinomina carta: aggiorna equipaggiamenti, collegamenti, mazzi e traduzioni', () => {
  const d = fresh(); d.i18n = { en: { 'move.jab.name': 'Jab EN' } }; assert.equal(renameId(d, 'move', 'jab', 'pugno'), null);
  assert.ok(!findMove(d, 'jab') && findMove(d, 'pugno')); assert.ok(d.styles[0].deck.includes('pugno') && !d.styles[0].deck.includes('jab'));
  assert.ok(allMoves(d).some(r => r.m.effect?.link?.from === 'pugno')); assert.equal(d.i18n.en['move.pugno.name'], 'Jab EN'); assert.equal(d.i18n.en['move.jab.name'], undefined);
  assert.ok(renameId(d, 'move', 'guard', 'pugno')); assert.ok(renameId(d, 'move', 'guard', 'no spazi')); assert.deepEqual(validate(d).filter(i => i.level === 'err'), []);
});
test('rinomina isola: aggiorna equipaggiamenti, scelte e id dei nemici', () => {
  const d = fresh(); assert.equal(renameId(d, 'region', 'desert', 'dune'), null); assert.ok(d.equipment.filter((e: any) => e.island === 'dune').length === 2); assert.ok(d.choices.every((c: any) => c.region !== 'desert')); assert.ok((d.regions as any[]).find(r => r.id === 'dune').enemies[0].id.startsWith('dune-'));
  assert.deepEqual(validate(d).filter(i => i.level === 'err'), []);
});
test('rinominazioni: catene collassate e script', () => {
  let l = addRename([], { kind: 'move', from: 'a', to: 'b' }); l = addRename(l, { kind: 'move', from: 'b', to: 'c' }); assert.deepEqual(l, [{ kind: 'move', from: 'a', to: 'c' }]); assert.deepEqual(addRename(l, { kind: 'move', from: 'c', to: 'a' }), []);
  const s = renameScript([{ kind: 'equipment', from: 'x', to: 'y' }]); assert.match(s, /mvimg "eq-x" "eq-y"/); assert.match(s, /mvimg "layer-x" "layer-y"/);
});
test('carte: nuova, duplicata, spostata ed eliminata', () => {
  const d = fresh(), id = newMove(d, null, 'base'); assert.ok(findMove(d, id)); const c = dupMove(d, id)!; assert.ok(findMove(d, c)); assert.equal(moveCard(d, id, 'wraps', 'adv'), null); assert.equal(findMove(d, id)!.slot, 'adv'); deleteMove(d, id); assert.ok(!findMove(d, id));
  assert.ok(imageKeyList(d).includes('card-jab') && imageKeyList(d).includes('layer-wraps'));
});
test('traduzioni dei contenuti: chiavi uniche e overlay per lingua', () => {
  const d = fresh(), keys = new Set<string>(); forEachText(d, (k) => { assert.ok(!keys.has(k), 'chiave duplicata ' + k); keys.add(k); }); assert.ok(keys.size > 300);
  d.i18n = { en: { 'move.jab.name': 'Quick Jab', 'region.boxing.name': 'Boxing Arena' } }; const l = localize(d, 'en') as any; assert.equal(l.baseMoves[0].name, 'Quick Jab'); assert.equal(l.regions[0].name, 'Boxing Arena'); assert.equal(localize(d, 'it'), d); assert.equal(d.baseMoves[0].name, 'Jab');
});
test('palette: variabili derivate dai 3 colori; scelte bilanciate', () => { const v = paletteVars({ bg: '#7a1616', accent: '#e04b4b', hi: '#ffd24a' }); assert.equal(v['--bg1'], '#7a1616'); assert.equal(v['--glow'], '#e04b4b'); assert.match(v['--bg0'], /^#[0-9a-f]{6}$/); assert.ok(choicePts({ gold: 2 }) === 2); });

import { buildTr } from '../src/i18n';
test('traduzione interfaccia: frasi, segnaposto, blocchi HTML e ordine delle parole', () => {
  const tr = buildTr({ 'Compra una mossa': 'Buy a move', 'Hai {0} monete': 'You have {0} coins', '{0} ti aspetta a {1}.': '{0} awaits you at {1}.', '<b>Trascina</b> il Jab sul campo.': '<b>Drag</b> the Jab onto the field.', 'Mazzo': '' });
  assert.equal(tr('Compra una mossa'), 'Buy a move'); assert.equal(tr('  Compra una mossa '), '  Buy a move '); assert.equal(tr('Hai 12 monete'), 'You have 12 coins'); assert.equal(tr('Gorin ti aspetta a Fighting Arena.'), 'Gorin awaits you at Fighting Arena.');
  assert.equal(tr('<b>Trascina</b> il Jab sul campo.'), '<b>Drag</b> the Jab onto the field.'); assert.equal(tr('Mazzo'), 'Mazzo'); assert.equal(tr('Testo sconosciuto'), 'Testo sconosciuto');
});

import en from '../data/locales/en.json';
test('inglese: tutti i testi dei contenuti sono tradotti e i segnaposto dell\'interfaccia coincidono', () => {
  const d = fresh(), miss: string[] = []; forEachText(d, (k) => { if (!d.i18n?.en?.[k]) miss.push(k); }); assert.deepEqual(miss, [], 'testi senza traduzione: ' + miss.slice(0, 5));
  const ph = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join(); for (const [k, v] of Object.entries(en as Record<string, string>)) if (v) assert.equal(ph(v), ph(k), `segnaposto diversi: ${k}`);
});
