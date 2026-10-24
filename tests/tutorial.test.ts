import { test } from 'node:test'; import assert from 'node:assert/strict';
import { newRun, setStyle, chooseRegion, buyOfferEq, buyOfferMv, buyEnergy, beginArena, playCard, endTurn, enemyStep, maxEnergy } from '../src/engine';
test('copione del tutorial: percorso previsto porta alla vittoria', () => {
  const r = newRun(11); r.hero = { name: 'R', avatar: 'a0' }; setStyle(r, 'boxing'); r.gold = 90; r.offers = { eq: ['wraps', 'stance', 'footwork'], mv: [null, null, null], eqPrice: r.offers.eqPrice, mvPrice: r.offers.mvPrice };
  assert.equal(chooseRegion(r, 'boxing'), null); assert.equal(buyOfferEq(r, 0), null); r.offers.mv = ['wraps_a1', 'wraps_a0', null]; assert.equal(buyOfferMv(r, 0), null); assert.equal(buyEnergy(r), null); assert.equal(maxEnergy(r), 4);
  assert.equal(beginArena(r), null); const c = r.combat!; c.hand = ['base:jab:0', 'base:jab:1', 'base:jab:2', 'base:guard:5', 'buy:wraps_a1']; c.draw = ['eq:wraps:0', 'eq:wraps:1', 'base:focus:9', 'base:guard:7', 'base:jab:4', 'base:jab:3']; c.discard = []; c.enemy.hp = c.enemy.maxHp = 22; c.energy = maxEnergy(r);
  for (const u of ['base:jab:0', 'base:jab:1', 'base:jab:2', 'base:guard:5']) assert.equal(playCard(r, u), null);
  assert.equal(c.tier, 0); endTurn(r); for (let i = 0; i < 4; i++) enemyStep(r); // resolve + prepara
  c.queue = [{ id: 'direct', name: 'D', icon: '', dmg: 5, hits: 1, block: 0, heal: 0, dur: 1 }, { id: 'heavy', name: 'H', icon: '', dmg: 7, hits: 1, block: 0, heal: 0, dur: 1 }];
  for (let i = 0; i < 12 && c.phase !== 'player'; i++) enemyStep(r);
  assert.equal(c.turn, 2); assert.ok(c.hand.includes('base:jab:3') && c.hand.includes('base:jab:4') && c.hand.includes('buy:wraps_a1')); assert.equal(c.enemy.hp, 8);
  for (const u of ['base:jab:3', 'base:jab:4', 'buy:wraps_a1']) assert.equal(playCard(r, u), null);
  endTurn(r); for (let i = 0; i < 6 && r.phase === 'combat'; i++) enemyStep(r); assert.equal(r.phase, 'store'); assert.equal(r.progress!.boxing, 1);
});
