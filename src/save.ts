import { EQUIPMENT, MOVES } from './data';
import { genOffers, type Run } from './engine';
export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
export const SAVE_KEY = 'cardrogue.run.v2';
export const saveRun = (r: Run, kv: KV) => { try { kv.setItem(SAVE_KEY, JSON.stringify(r)); } catch { /* storage pieno/non disponibile */ } };
export const clearRun = (kv: KV) => kv.removeItem(SAVE_KEY);
export function loadRun(kv: KV): Run | null {
  try {
    const r = JSON.parse(kv.getItem(SAVE_KEY) ?? 'null');
    if (!r || r.v !== 1 || !['store', 'combat', 'over'].includes(r.phase)) return null;
    if (![r.arena, r.gold, r.hp, r.slots, r.rng].every(Number.isFinite)) return null;
    if (![r.equipped, r.bought, r.retained, r.deck].every(Array.isArray)) return null;
    if (!r.equipped.every((e: string) => EQUIPMENT[e]) || !r.bought.every((b: string) => MOVES[b])) return null;
    if (r.phase === 'combat' && (!r.combat || !Array.isArray(r.combat.queue) || typeof r.combat.energy !== 'number' || typeof r.combat.played !== 'object' || typeof r.combat.seq !== 'number' || !r.combat.field || !r.combat.foeField)) return null;
    if (!r.offers || !Array.isArray(r.offers.eq) || !Array.isArray(r.offers.mv) || typeof r.offers.eqPrice !== 'number') genOffers(r); r.energyBonus = Number.isFinite(r.energyBonus) ? r.energyBonus : 0; return r as Run;
  } catch { return null; }
}

/** Punteggio migliore: si salva solo il più alto, con lo stesso meccanismo (e lo stesso storage) della run in corso. */
export const BEST_KEY = 'cardrogue.best.v1';
/** Punteggio di una run = arene superate. */
export const runScore = (r: Run) => Math.max(0, r.arena - 1);
export function loadBest(kv: KV): number { try { const n = Number(JSON.parse(kv.getItem(BEST_KEY) ?? '0')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; } catch { return 0; } }
/** Salva il punteggio solo se supera il record; restituisce true se è un nuovo record. */
export function saveBest(score: number, kv: KV): boolean {
  if (!Number.isFinite(score) || Math.floor(score) <= loadBest(kv)) return false;
  try { kv.setItem(BEST_KEY, JSON.stringify(Math.floor(score))); return true; } catch { return false; /* storage pieno/non disponibile */ }
}
