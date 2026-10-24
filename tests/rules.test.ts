import { test } from 'node:test'; import assert from 'node:assert/strict';
import { newRun, maxHp, askMercy, healRun, setStyle, effCost, choosePick, drawDiscard, sellCard, chooseRegion, unlocked, resolvePending, enemyFor, buyOfferEq, buyOfferMv, buyEnergy, maxEnergy, energyPrice, buyEquipment, sellEquipment, buyMove, sellMove, toggleDeck, ownedCards, beginArena, playCard, endTurn, enemyStep, type Run } from '../src/engine';
import { EQUIPMENT, MOVES, STYLES } from '../src/data'; import { REGIONS } from '../src/regions'; import { CONFIG } from '../src/config'; import { saveRun, loadRun, SAVE_KEY, type KV } from '../src/save';
const kv = (): KV & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k) }; };
const settle = (r: Run) => { const c = r.combat!; for (let i = 0; i < 10 && c.phase === 'resolve'; i++) enemyStep(r); };
const rich = (): Run => { const r = newRun(1); r.gold = 9999; return r; };
test('vittoria: nemico a 0 PV -> store, oro e arena avanzano', () => {
  const r = newRun(1); assert.equal(beginArena(r), null); r.combat!.enemy.hp = 1;
  const j = 'base:jab:0'; r.combat!.hand.push(j);
  if (j) { const g = r.gold; assert.equal(playCard(r, j), null); assert.equal(r.phase, 'combat'); endTurn(r); settle(r); assert.equal(r.phase, 'store'); assert.equal(r.arena, 2); assert.ok(r.gold > g); }
});
test('sconfitta: PV a 0 -> fine run', () => {
  const r = newRun(1); beginArena(r); r.hp = 1; endTurn(r); enemyStep(r); r.combat!.queue = [{ name: 'x', icon: '', dmg: 5, hits: 1, block: 0, heal: 0, dur: 1 }]; enemyStep(r); enemyStep(r);
  assert.equal(r.phase, 'over'); assert.equal(r.combat, null); assert.ok(r.hp === 0);
});
test('acquisti: oro insufficiente e sottrazione corretta', () => {
  const r = newRun(1); r.gold = 5; assert.ok(buyEquipment(r, 'wraps')); assert.equal(r.gold, 5);
  r.gold = 100; assert.equal(buyEquipment(r, 'wraps'), null); assert.equal(r.gold, 100 - EQUIPMENT.wraps.price);
  assert.ok(buyEquipment(r, 'wraps'));
});
test('vendita: rimborso 50% e oggetti non posseduti', () => {
  const r = rich(); assert.ok(sellEquipment(r, 'servo')); buyEquipment(r, 'servo'); const g = r.gold;
  assert.equal(sellEquipment(r, 'servo'), null); assert.equal(r.gold, g + EQUIPMENT.servo.price * CONFIG.sellRatio);
  buyEquipment(r, 'wraps'); assert.ok(sellMove(r, 'wraps_a0')); assert.equal(buyMove(r, 'wraps_a0'), null);
  const g2 = r.gold; assert.equal(sellMove(r, 'wraps_a0'), null); assert.equal(r.gold, g2 + 11);
  assert.ok(buyMove(r, 'servo_a0'), 'serve equipaggiamento installato');
});
test('limite slot', () => {
  const r = rich(); ['wraps', 'plating', 'servo', 'blade'].forEach(e => assert.equal(buyEquipment(r, e), null));
  assert.ok(buyEquipment(r, 'reactor')); r.slots = 5; assert.equal(buyEquipment(r, 'reactor'), null);
});
test('mazzo attivo max 30, collezione può superarlo', () => {
  const r = rich(); r.slots = 15; Object.keys(EQUIPMENT).forEach(e => { buyEquipment(r, e); buyMove(r, EQUIPMENT[e].advanced[0]); });
  const owned = ownedCards(r); assert.ok(owned.length > CONFIG.maxDeck); assert.equal(r.deck.length, CONFIG.maxDeck);
  const out = owned.find(c => !r.deck.includes(c.uid))!; assert.ok(toggleDeck(r, out.uid));
  assert.equal(toggleDeck(r, r.deck[0]), null); assert.equal(toggleDeck(r, out.uid), null); assert.equal(r.deck.length, CONFIG.maxDeck);
});
test('persistenza e ripristino', () => {
  const s = kv(), r = rich(); buyEquipment(r, 'blade'); beginArena(r); saveRun(r, s);
  assert.deepEqual(loadRun(s), r); s.m.set(SAVE_KEY, '{"v":1}'); assert.equal(loadRun(s), null); s.m.set(SAVE_KEY, 'x'); assert.equal(loadRun(s), null);
});
test('mano: 5 iniziali, +1 a turno, la mano persiste; il nemico gioca una carta per volta', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; assert.equal(c.hand.length, 5); const keep = [...c.hand];
  endTurn(r); settle(r); const n = c.queue.length; assert.ok(n >= 2); enemyStep(r); assert.equal(c.queue.length, n - 1); assert.ok(c.last);
  for (let i = 0; i < 20 && c.phase === 'enemy'; i++) enemyStep(r);
  assert.deepEqual(c.played, {}); assert.equal(c.phase, 'player'); assert.equal(c.hand.length, 7); assert.ok(keep.every(u => c.hand.includes(u)));
});
test('energia: il costo viene scalato e senza energia la carta non si gioca', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.hand = ['eq:wraps:1', 'eq:wraps:2', 'base:jab:0'];
  const e0 = c.energy; assert.equal(playCard(r, 'eq:wraps:1'), null); assert.equal(c.energy, e0 - 1); assert.equal(playCard(r, 'eq:wraps:2'), null);
  assert.equal(c.energy, 0); assert.ok(playCard(r, 'base:jab:0')); assert.equal(c.hand.length, 1);
});
test('estensioni energia: prezzo crescente, limite 10, energia a inizio turno', () => {
  const r = rich(); assert.equal(maxEnergy(r), CONFIG.energyPerTurn); const p0 = energyPrice(r), g = r.gold;
  assert.equal(buyEnergy(r), null); assert.equal(r.gold, g - p0); assert.ok(energyPrice(r) > p0);
  while (maxEnergy(r) < CONFIG.maxEnergy) assert.equal(buyEnergy(r), null);
  assert.equal(maxEnergy(r), 10); const g2 = r.gold; assert.ok(buyEnergy(r)); assert.equal(r.gold, g2);
  beginArena(r); assert.equal(r.combat!.energy, 10); const q = newRun(1); q.gold = 0; assert.ok(buyEnergy(q));
});
test('costi carta diversificati e crescenti con la forza', () => {
  assert.ok(new Set(Object.values(MOVES).map(m => m.cost)).size >= 5); assert.ok(MOVES.jab.cost < MOVES.rift_a0.cost);
});
test('combo base: stessa carta nello stesso round +10%/+20%, massimo 3', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 10; c.hand = Array(4).fill('eq:servo:0');
  for (let i = 0; i < 4; i++) assert.equal(playCard(r, 'eq:servo:0'), null); assert.deepEqual(c.field.off.map(p => p.dmg), [9, 11, 12, 12]); assert.equal(c.enemy.hp, 1000);
});
test('concatenazione: bonus solo se la carta precedente è quella indicata', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 10; c.hand = ['eq:wraps:2', 'base:jab:0', 'eq:wraps:2'];
  for (let i = 0; i < 3; i++) assert.equal(playCard(r, c.hand[0]), null); assert.deepEqual(c.field.off.map(p => p.dmg), [5, 4, 10]);
});
test('campo: danni solo a fine turno; pesca immediata al piazzamento', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.energy = 10; c.enemy.hp = c.enemy.maxHp = 1000; c.hand = ['base:jab:0', 'base:focus:8']; const dr = c.draw.length;
  assert.equal(playCard(r, 'base:jab:0'), null); assert.equal(c.enemy.hp, 1000); assert.equal(c.field.off.length, 1);
  assert.equal(playCard(r, 'base:focus:8'), null); assert.equal(c.field.def.length, 1); assert.equal(c.hand.length, 1); assert.equal(c.draw.length, dr - 1);
  endTurn(r); settle(r); assert.equal(c.enemy.hp, 996); assert.equal(c.field.off.length, 0);
});
test('difese: durata in turni', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.energy = 10; c.hand = ['eq:plating:0'];
  assert.equal(playCard(r, 'eq:plating:0'), null); assert.equal(c.field.def[0].ttl, 2);
  endTurn(r); settle(r); c.queue = []; enemyStep(r); assert.equal(c.field.def.length, 1); assert.equal(c.field.def[0].ttl, 1);
  endTurn(r); settle(r); c.queue = []; enemyStep(r); assert.equal(c.field.def.length, 0);
});
test('difesa "finché abbattuta" assorbe i colpi e poi cade', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.energy = 10; c.hand = ['buy:plating_a0'];
  assert.equal(playCard(r, 'buy:plating_a0'), null); assert.equal(c.field.def[0].ttl, -1);
  endTurn(r); settle(r); c.queue = []; c.foeField.off.push({ uid: '', name: 'x', icon: '', src: '', dmg: 20, hits: 1, block: 0, ttl: 1 }); enemyStep(r);
  assert.equal(r.hp, 36); assert.equal(c.field.def.length, 0);
});
test('store: 3 offerte casuali, acquisto per offerta, mosse offribili solo se l\'equipaggiamento è installato', () => {
  const r = rich(); assert.equal(r.offers.eq.filter(Boolean).length, 3); assert.equal(r.offers.mv.filter(Boolean).length, 0);
  const id = r.offers.eq[0]!, g = r.gold; assert.equal(buyOfferEq(r, 0), null); assert.equal(r.gold, g - EQUIPMENT[id].price); assert.equal(r.offers.eq[0], null); assert.ok(buyOfferEq(r, 0));
  const mi = r.offers.mv.findIndex(m => m && MOVES[m].source === id); assert.ok(mi >= 0);
  const g2 = r.gold; assert.equal(buyOfferMv(r, mi), null); assert.ok(r.gold < g2); assert.equal(r.offers.mv[mi], null); assert.ok(buyOfferMv(r, mi));
});
test('i nemici hanno equipaggiamento che cresce con l\'arena', () => {
  assert.equal(enemyFor(1).gear.length, 1); assert.equal(enemyFor(4).gear.length, 2); assert.ok(enemyFor(40).gear.length <= Object.keys(EQUIPMENT).length);
  assert.ok(enemyFor(1).hp >= Math.round(CONFIG.enemy.hpBase));
});
test('carta misteriosa: prezzo ridotto, carta reale, rimborso 50% sul prezzo pagato', () => {
  const r = rich(), id = r.offers.eq[2]!, g = r.gold, p = r.offers.eqPrice; assert.ok(p > 0 && id);
  assert.equal(buyOfferEq(r, 2), null); assert.equal(r.gold, g - p); assert.ok(r.equipped.includes(id)); assert.equal(r.paid[id], p); assert.equal(r.offers.eq[2], null);
  const g2 = r.gold; assert.equal(sellEquipment(r, id), null); assert.equal(r.gold, g2 + Math.floor(p * CONFIG.sellRatio));
});
test('carta misteriosa senza slot liberi: si paga, poi sostituisci o scarta (metà del valore)', () => {
  const r = rich(), hid = r.offers.eq[2]!; Object.keys(EQUIPMENT).filter(e => e !== hid).slice(0, 4).forEach(e => assert.equal(buyEquipment(r, e), null));
  const g = r.gold; assert.equal(buyOfferEq(r, 2), null); assert.equal(r.pending!.id, hid); assert.equal(r.gold, g - r.offers.eqPrice); assert.ok(beginArena(r));
  const g2 = r.gold; assert.equal(resolvePending(r, 'discard'), null); assert.equal(r.gold, g2 + Math.floor(EQUIPMENT[hid].price * CONFIG.sellRatio)); assert.equal(r.pending, null);
  r.pending = { id: hid, paid: 10 }; const old = r.equipped[0]; assert.ok(resolvePending(r, 'replace', 'nope')); assert.equal(resolvePending(r, 'replace', old), null);
  assert.ok(r.equipped.includes(hid) && !r.equipped.includes(old)); assert.equal(r.paid[hid], 10); assert.equal(r.pending, null);
});
test('isole: bloccate finché non si vincono 5 partite; progressi, sblocco e nemici per isola', () => {
  const r = newRun(1); assert.deepEqual(unlocked(r), ['boxing']); assert.ok(chooseRegion(r, 'nope')); assert.ok(chooseRegion(r, 'battlefield')); assert.equal(chooseRegion(r, 'boxing'), null);
  assert.equal(enemyFor(1, 'desert').art, 'desert'); assert.notEqual(enemyFor(1, 'desert').name, enemyFor(1, 'volcano').name);
  const win = () => { beginArena(r); r.combat!.enemy.hp = 1; r.combat!.hand.push('base:jab:0'); playCard(r, 'base:jab:0'); endTurn(r); settle(r); };
  beginArena(r); assert.equal(r.combat!.enemy.name, REGIONS.boxing.enemies[0].name); assert.equal(r.combat!.enemy.art, 'boxing'); r.phase = 'store'; r.combat = null;
  win(); assert.equal(r.progress!.boxing, 1); assert.equal(r.needsMap, false); assert.deepEqual(unlocked(r), ['boxing']);
  r.progress = { boxing: 4 }; win(); assert.equal(r.progress.boxing, 5); assert.equal(r.needsMap, true); assert.deepEqual(unlocked(r), ['boxing', 'battlefield']);
  assert.equal(chooseRegion(r, 'battlefield'), null); beginArena(r); assert.equal(r.combat!.enemy.name, REGIONS.battlefield.enemies[0].name);
});
test('vendita carte: tutte vendibili, ma nel mazzo restano almeno 10 carte', () => {
  const r = rich(); assert.ok(sellCard(r, 'base:jab:0')); buyEquipment(r, 'wraps'); const g = r.gold;
  assert.equal(sellCard(r, 'base:jab:0'), null); assert.equal(r.gold, g + CONFIG.cardValueBase); assert.equal(r.deck.length, 12); assert.ok(!ownedCards(r).some(c => c.uid === 'base:jab:0'));
  assert.equal(sellCard(r, 'eq:wraps:0'), null); assert.equal(sellCard(r, 'eq:wraps:1'), null); assert.equal(r.deck.length, 10);
  assert.ok(sellCard(r, 'eq:wraps:2')); assert.ok(sellEquipment(r, 'wraps')); assert.ok(sellCard(r, 'nope'));
});
test('god mode: tutte le isole sbloccate', () => {
  const r = newRun(1); assert.deepEqual(unlocked(r), ['boxing']); r.god = true; assert.equal(unlocked(r).length, 6); assert.equal(chooseRegion(r, 'volcano'), null);
});
test('carta di fuga: requisiti di partita, poi si lascia il duello senza conseguenze', () => {
  const r = rich(); beginArena(r); const c = r.combat!, g = r.gold, a = r.arena; c.energy = 10; c.hand = ['buy:footwork_a1'];
  assert.ok(playCard(r, 'buy:footwork_a1')); assert.equal(r.phase, 'combat'); r.hp = 10;
  assert.equal(playCard(r, 'buy:footwork_a1'), null); assert.equal(r.phase, 'store'); assert.equal(r.combat, null); assert.equal(r.outcome, 'flee'); assert.equal(r.gold, g); assert.equal(r.arena, a); assert.equal(r.needsMap, false);
});
test('pietà: se risparmiato soldi dimezzati e si torna allo store; altrimenti il duello continua', () => {
  let s1 = false, s2 = false;
  for (let s = 1; s < 80 && !(s1 && s2); s++) {
    const r = rich(); r.rng = s; beginArena(r); const g = r.gold, res = askMercy(r);
    if (res.spared) { s1 = true; assert.equal(r.phase, 'store'); assert.equal(r.gold, Math.floor(g / 2)); assert.equal(r.outcome, 'spared'); assert.equal(r.needsMap, false); }
    else { s2 = true; assert.equal(r.phase, 'combat'); assert.equal(r.combat!.phase, 'resolve'); assert.equal(r.gold, g); for (let i = 0; i < 30 && r.combat && (r.combat.phase as string) !== 'player'; i++) enemyStep(r); assert.match(askMercy(r).err ?? '', /già/); }
  }
  assert.ok(s1 && s2);
});
test('vita: duello a PV pieni (anche con PV massimi aumentati); sotto il 30% parti all\'80% finché non paghi la cura', () => {
  const r = rich(); buyEquipment(r, 'plating'); beginArena(r); assert.equal(maxHp(r), 48); assert.equal(r.hp, 48);
  r.hp = 10; r.combat!.enemy.hp = 1; r.combat!.hand.push('base:jab:0'); playCard(r, 'base:jab:0'); endTurn(r); settle(r); assert.equal(r.wounded, true);
  const r2: Run = JSON.parse(JSON.stringify(r)); beginArena(r2); assert.equal(r2.hp, Math.ceil(48 * 0.8));
  const g = r.gold; assert.equal(healRun(r), null); assert.equal(r.gold, g - 15); assert.ok(healRun(r)); beginArena(r); assert.equal(r.hp, 48);
});
test('combo: valida solo tra carte consecutive; Comboo = catena di almeno 3 mosse (uguali o concatenate)', () => {
  const r = rich(); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 10; c.hand = ['eq:servo:0', 'base:jab:0', 'eq:servo:0'];
  for (let i = 0; i < 3; i++) assert.equal(playCard(r, c.hand[0]), null); assert.deepEqual(c.field.off.map(p => p.dmg), [9, 4, 9]); assert.equal(c.tier, 0); // non adiacenti: nessun bonus
  c.hand = ['base:jab:1', 'base:jab:2', 'eq:wraps:2']; c.lastBy = { off: null, def: null }; c.runs = { off: 0, def: 0 }; c.chains = { off: 0, def: 0 }; c.field.off = [];
  playCard(r, 'base:jab:1'); assert.equal(c.tier, 0); playCard(r, 'base:jab:2'); assert.equal(c.tier, 1); playCard(r, 'eq:wraps:2'); assert.equal(c.tier, 2); // jab, jab (+20%), Uno-due dopo Jab: Comboo
  c.hand.push('base:guard:5'); playCard(r, 'base:guard:5'); assert.equal(c.tier, 0); assert.equal(c.combo, '');
});
test('combo: una carta di genere diverso non interrompe la combo (jab, guardia, jab = combo di jab)', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 30; c.hand = ['base:jab:0', 'base:guard:5', 'base:jab:1'];
  for (let i = 0; i < 3; i++) assert.equal(playCard(r, c.hand[0]), null); assert.deepEqual(c.field.off.map(p => p.dmg), [4, 5]); assert.equal(c.field.def.length, 1);
});
test('concatenazione tra generi: Distorsione (difesa) -> Nova (attacco) anche con un attacco in mezzo', () => {
  const r = newRun(3); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 30; c.hand = ['eq:rift:1', 'base:jab:0', 'buy:rift_a0'];
  for (let i = 0; i < 3; i++) assert.equal(playCard(r, c.hand[0]), null); assert.deepEqual(c.field.off.map(p => p.dmg), [4, 35]);
});
test('stile iniziale scelto a mano: ogni stile ha il suo mazzo base di 10 carte', () => {
  for (const st of STYLES) { const r = newRun(1); assert.equal(setStyle(r, st.id), null); assert.equal(r.deck.length, 10); assert.deepEqual(ownedCards(r).map(c => c.move), st.deck); }
  assert.ok(setStyle(newRun(1), 'nope'));
});
const fresh = (hand: string[]) => { const r = newRun(3); beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 30; c.hand = hand; return { r, c }; };
test('sinergie: Adrenalina (+2 alle offensive, anche già schierate), Momentum, Flow', () => {
  let { r, c } = fresh(['base:jab:0', 'buy:wraps_a1', 'base:jab:1']); playCard(r, 'base:jab:0'); playCard(r, 'buy:wraps_a1'); assert.equal(c.field.off[0].dmg, 6); playCard(r, 'base:jab:1'); assert.equal(c.field.off[1].dmg, 7); assert.equal(c.field.def.length, 0);
  ({ r, c } = fresh(['base:jab:0', 'base:guard:5', 'buy:servo_a1'])); for (let i = 0; i < 3; i++) playCard(r, c.hand[0]); assert.equal(c.field.off[1].dmg, 3);
  ({ r, c } = fresh(['base:jab:0', 'base:jab:1', 'buy:stance_a1'])); for (let i = 0; i < 3; i++) playCard(r, c.hand[0]); assert.equal(c.field.def[0].block, 4);
});
test('sinergie: Riscaldamento (prossima carta a costo 0), Duplicazione (schierata due volte), Punti deboli (scudi nemici ignorati)', () => {
  let { r, c } = fresh(['buy:footwork_a2', 'eq:servo:0']); c.energy = 5; playCard(r, 'buy:footwork_a2'); assert.equal(c.energy, 4); playCard(r, 'eq:servo:0'); assert.equal(c.energy, 4);
  ({ r, c } = fresh(['buy:fruit_a2', 'base:jab:0'])); playCard(r, 'buy:fruit_a2'); playCard(r, 'base:jab:0'); assert.equal(c.field.off.length, 2); assert.equal(c.field.off[1].uid, '');
  ({ r, c } = fresh(['base:jab:0', 'buy:blade_a1'])); c.foeField.def.push({ uid: '', name: 's', icon: '', src: '', dmg: 0, hits: 1, block: 50, ttl: 5 }); for (let i = 0; i < 2; i++) playCard(r, c.hand[0]);
  endTurn(r); settle(r); assert.equal(c.enemy.hp, 996); assert.equal(c.foeField.def[0].block, 50);
});
test('sinergie: Clonazione copia l\'ultima carta; Stratega mostra 3 carte e la scelta costa 1', () => {
  let { r, c } = fresh(['buy:dash_a2']); assert.ok(playCard(r, 'buy:dash_a2'));
  ({ r, c } = fresh(['base:jab:0', 'buy:dash_a2'])); playCard(r, 'base:jab:0'); playCard(r, 'buy:dash_a2'); assert.ok(c.hand.some(u => u.startsWith('clone:jab:'))); const cl = c.hand[0]; assert.equal(playCard(r, cl), null); assert.equal(c.discard.includes(cl), false);
  ({ r, c } = fresh(['buy:reactor_a1'])); c.draw = ['base:guard:5', 'base:jab:1', 'eq:servo:0']; playCard(r, 'buy:reactor_a1'); assert.equal(c.pick!.length, 3); assert.ok(playCard(r, 'buy:reactor_a1')); assert.ok(endTurn(r));
  assert.equal(choosePick(r, 'eq:servo:0'), null); assert.ok(c.hand.includes('eq:servo:0')); assert.equal(effCost(c, 'eq:servo:0'), 1); assert.equal(c.draw.includes('eq:servo:0'), false);
});
test('mazzo finito: nessun rimescolo automatico; mano massima 10; per 3 energia gli scarti tornano nel mazzo e si pesca 1 carta', () => {
  const { r, c } = fresh(Array(9).fill('base:jab:0')); c.draw = ['base:guard:5', 'base:guard:6', 'base:guard:7']; endTurn(r); settle(r); c.queue = []; enemyStep(r);
  assert.equal(c.hand.length, 10); assert.equal(c.draw.length, 2); // a 9 carte se ne pesca una sola
  c.draw = []; c.discard = ['base:jab:3', 'base:jab:4']; c.hand = ['base:guard:5']; c.energy = 2; assert.ok(drawDiscard(r)); c.energy = 5;
  assert.equal(drawDiscard(r), null); assert.equal(c.energy, 2); assert.equal(c.hand.length, 2); assert.equal(c.discard.length, 0); assert.equal(c.draw.length, 1); assert.ok(['base:jab:3', 'base:jab:4'].includes(c.hand[1]) && ['base:jab:3', 'base:jab:4'].includes(c.draw[0]) && c.hand[1] !== c.draw[0]);
  c.draw = ['base:jab:1']; assert.ok(drawDiscard(r)); c.draw = []; c.hand = Array(10).fill('base:jab:0'); c.energy = 9; assert.ok(drawDiscard(r));
});

test('Scudo d\'assalto: danno pari agli scudi attivi, aggiornato dalle difese giocate dopo', () => {
  const { r, c } = fresh(['base:guard:5', 'buy:stance_a2', 'base:guard:6']);
  assert.equal(playCard(r, 'base:guard:5'), null); const sh1 = c.field.def.reduce((s, p) => s + p.block, 0); assert.ok(sh1 > 0);
  assert.equal(playCard(r, 'buy:stance_a2'), null); assert.equal(c.field.off.length, 1); assert.equal(c.field.off[0].dmg, sh1); assert.equal(c.hand.length, 1);
  assert.equal(playCard(r, 'base:guard:6'), null); const sh2 = c.field.def.reduce((s, p) => s + p.block, 0); assert.ok(sh2 > sh1); assert.equal(c.field.off[0].dmg, sh2);
});
