import { test } from 'node:test'; import assert from 'node:assert/strict';
import { newRun, beginArena, playCard, recallCard, maxHp, cardInfo, endTurn, enemyStep } from '../src/engine'; import type { Run } from '../src/engine';
import { MOVES, EQUIPMENT } from '../src/data';
// Test delle carte con effetti particolari: Lama boomerang, Condotto d'assorbimento, Metamorfosi, Assalto autonomo, Ultima brace.
const duel = (): Run => { const r = newRun(5); r.region = 'battlefield'; r.skills = ['recall']; beginArena(r); const c = r.combat!; c.enemy.hp = c.enemy.maxHp = 1000; c.energy = 10; c.hand = []; c.draw = []; return r; };

test('le nuove carte esistono, sono tra le avanzate dei loro equipaggiamenti e hanno il costo previsto', () => {
  const where: Record<string, string> = { knives_a3: 'knives', reactor_a2: 'reactor', fruit_a3: 'fruit', stand_a3: 'stand', phoenix_a3: 'phoenix' };
  for (const [id, eq] of Object.entries(where)) { assert.ok(MOVES[id], id); assert.ok(EQUIPMENT[eq].advanced.includes(id), `${id} in ${eq}`); assert.ok(MOVES[id].price > 0); }
  assert.equal(MOVES.knives_a3.cost, 2); assert.equal(MOVES.reactor_a2.cost, 3); assert.equal(MOVES.fruit_a3.cost, 2); assert.equal(MOVES.stand_a3.cost, 3); assert.equal(MOVES.phoenix_a3.cost, 3);
});

test('Lama boomerang: ripresa in mano = 6 danni diretti, nessun rimborso di energia', () => {
  const r = duel(), c = r.combat!; c.hand = ['buy:knives_a3']; assert.equal(playCard(r, 'buy:knives_a3'), null);
  const p = c.field.off[0]; assert.equal(p.rc, 6); assert.equal(c.energy, 8);
  assert.equal(recallCard(r, p.id!), null); assert.equal(c.enemy.hp, 994); assert.equal(c.energy, 8); assert.deepEqual(c.hand, ['buy:knives_a3']); assert.equal(c.field.off.length, 0);
});

test('Lama boomerang: il colpo che abbatte il nemico a 0 PV chiude il duello con la vittoria', () => {
  const r = duel(), c = r.combat!; c.hand = ['buy:knives_a3']; playCard(r, 'buy:knives_a3'); c.enemy.hp = 6; assert.equal(recallCard(r, c.field.off[0].id!), null);
  assert.equal(c.enemy.hp, 0); assert.equal(c.phase, 'resolve');
});

test('Condotto d\'assorbimento: cura 1 PV per ogni danno diretto inflitto (passiva del Reattore: max 2 volte per turno)', () => {
  const r = duel(), c = r.combat!; r.equipped = ['reactor']; r.hp = 10; c.hand = ['buy:reactor_a2', 'eq:reactor:0', 'eq:reactor:1'];
  assert.equal(playCard(r, 'buy:reactor_a2'), null); assert.equal(c.field.def[0].lch, 1); assert.equal(r.hp, 11); // la passiva scatta anche sul Condotto (arma da fuoco): 1 danno diretto
  assert.equal(playCard(r, 'eq:reactor:0'), null); assert.equal(r.hp, 12); assert.equal(c.enemy.hp, 998);
  assert.equal(playCard(r, 'eq:reactor:1'), null); assert.equal(r.hp, 12); assert.equal(c.enemy.hp, 998); // passiva esaurita: nessun danno diretto, nessuna cura
});

test('Condotto + Lama boomerang: la ripresa in mano (6 danni diretti) cura 6 PV', () => {
  const r = duel(), c = r.combat!; r.hp = 10; c.hand = ['buy:reactor_a2', 'buy:knives_a3']; playCard(r, 'buy:reactor_a2'); playCard(r, 'buy:knives_a3');
  assert.equal(recallCard(r, c.field.off[0].id!), null); assert.equal(r.hp, 16); assert.equal(c.enemy.hp, 994);
});

test('Condotto: la cura non supera i PV massimi', () => {
  const r = duel(), c = r.combat!; r.equipped = ['reactor']; r.hp = maxHp(r) - 1; c.hand = ['buy:reactor_a2', 'eq:reactor:0']; playCard(r, 'buy:reactor_a2'); assert.equal(r.hp, maxHp(r)); playCard(r, 'eq:reactor:0'); assert.equal(r.hp, maxHp(r));
});

test('Condotto: a inizio turno infligge 2 danni diretti (e la carta resta sul campo)', () => {
  const r = duel(), c = r.combat!; c.hand = ['buy:reactor_a2']; playCard(r, 'buy:reactor_a2'); c.field.def[0].block = 999; /* regge agli attacchi nemici */ endTurn(r); for (let i = 0; i < 40 && c.phase !== 'player'; i++) enemyStep(r);
  assert.equal(c.phase, 'player'); assert.equal(c.enemy.hp, 998); assert.equal(c.field.def.filter(p => p.mv === 'reactor_a2').length, 1);
});

test('Ultima brace: a mazzo finito cura completamente, altrimenti no', () => {
  let r = duel(), c = r.combat!; r.hp = 5; c.hand = ['buy:phoenix_a3']; c.draw = ['base:jab:0', 'base:jab:1']; assert.equal(playCard(r, 'buy:phoenix_a3'), null);
  assert.equal(c.draw.length, 0); assert.equal(c.hand.length, 2); assert.equal(r.hp, maxHp(r));
  r = duel(); c = r.combat!; r.hp = 5; c.hand = ['buy:phoenix_a3']; c.draw = ['base:jab:0', 'base:jab:1', 'base:jab:2']; assert.equal(playCard(r, 'buy:phoenix_a3'), null);
  assert.equal(c.draw.length, 1); assert.equal(r.hp, 5);
});

test('Assalto autonomo: gioca 2 carte casuali dal mazzo gratis', () => {
  const r = duel(), c = r.combat!; c.hand = ['buy:stand_a3']; c.draw = ['base:jab:0', 'base:jab:1', 'base:guard:0'];
  assert.equal(playCard(r, 'buy:stand_a3'), null); assert.equal(c.energy, 7); // solo il costo di Assalto autonomo
  assert.equal(c.draw.length, 1); assert.equal(c.field.off.length + c.field.def.length, 2); assert.equal(c.hand.length, 0);
});

test('Assalto autonomo: non si gioca a mazzo finito; le carte di fuga e quelle non schierabili restano nel mazzo', () => {
  const r = duel(), c = r.combat!; c.hand = ['buy:stand_a3']; assert.ok(playCard(r, 'buy:stand_a3')); assert.equal(c.energy, 10); assert.equal(cardInfo(r, 'buy:stand_a3').playable, false);
  c.draw = ['buy:fruit_a1', 'base:jab:0']; assert.equal(playCard(r, 'buy:stand_a3'), null); assert.ok(c.draw.includes('buy:fruit_a1')); assert.equal(r.phase, 'combat'); assert.equal(c.field.off.length, 1);
});

test('Assalto autonomo: se una carta abbatte il nemico non ne gioca altre', () => {
  const r = duel(), c = r.combat!; c.hand = ['buy:stand_a3']; c.draw = ['buy:reactor_a2', 'buy:knives_a3']; r.equipped = ['reactor']; c.enemy.hp = 1;
  assert.equal(playCard(r, 'buy:stand_a3'), null); assert.equal(c.enemy.hp, 0); assert.equal(c.phase, 'resolve');
});

test('Metamorfosi: la prossima carta diventa la più costosa del mazzo, ma si paga il costo della carta in mano', () => {
  const r = duel(), c = r.combat!; r.deck = ['base:jab:0', 'base:guard:0', 'buy:fruit_a0', 'buy:fruit_a3'];
  const top = Math.max(...r.deck.map(u => MOVES[u.split(':')[1]].cost)); assert.equal(MOVES.fruit_a0.cost, top); assert.ok(MOVES.fruit_a0.cost > MOVES.jab.cost);
  c.hand = ['buy:fruit_a3', 'base:jab:0', 'base:jab:1']; assert.equal(playCard(r, 'buy:fruit_a3'), null); assert.equal(c.mods!.morph, true); assert.ok(c.syn!.text.includes(MOVES.fruit_a0.name));
  assert.equal(cardInfo(r, 'base:jab:0').boosted, true);
  const e0 = c.energy; assert.equal(playCard(r, 'base:jab:0'), null); assert.equal(c.energy, e0 - MOVES.jab.cost + (MOVES.fruit_a0.effect.energy ?? 0)); // costo del Jab + l'energia data dalla carta in cui si trasforma
  const p = c.field.off[0]; assert.equal(p.mv, 'fruit_a0'); assert.ok(p.dmg >= 22); assert.equal(p.uid, 'base:jab:0'); assert.equal(c.mods!.morph, false);
  assert.equal(playCard(r, 'base:jab:1'), null); assert.equal(c.field.off[1].mv, 'jab'); // vale solo per UNA carta
});

test('Metamorfosi: se la carta più costosa è difensiva finisce sulla riga difensiva; il campo pieno non consuma l\'effetto', () => {
  const r = duel(), c = r.combat!; r.deck = ['base:jab:0', 'buy:fruit_a3', 'buy:stand_a1']; assert.equal(MOVES.stand_a1.cost, 4);
  c.hand = ['buy:fruit_a3', 'base:jab:0']; playCard(r, 'buy:fruit_a3'); assert.equal(playCard(r, 'base:jab:0'), null); assert.equal(c.field.def[0].mv, 'stand_a1'); assert.equal(c.field.off.length, 0);
});
