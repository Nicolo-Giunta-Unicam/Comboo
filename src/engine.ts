import { CONFIG } from './config';
import { CHOICES, ENEMY_MOVES, EQUIPMENT, MOVES, STYLES, moveOf, type Move, type Cat, type CatOrAny, type ChoiceEv, type ChoiceFx, type ChoiceOpt, EPILOGUES, VIRTUES, type Cond, type PerkFx, type VirtId, type VirtMap, type Scale, type TrigOn, type Trigger } from './data';
import { REGION_LIST, REGIONS } from './regions';
import { defeatOutcome, movesRetainedAfterRemoval } from './policies';
export type Phase = 'store' | 'combat' | 'over';
export type Err = string | null;
export interface Enemy { name: string; tier: string; hp: number; maxHp: number; block: number; gear: string[]; art?: string; id?: string; atk: number }
export interface Combat { act?: Record<string, number>; pu?: Record<string, number>; foeDealt?: number; enemy: Enemy; phase: 'player' | 'resolve' | 'enemy'; mercy?: boolean; tier?: number; lastBy?: Rec2<string | null>; mods?: { off: number; bypass: boolean; freeNext: boolean; dupNext: boolean; combos: number; morph?: boolean }; auto?: number; cardCost?: Record<string, number>; lastUid?: string; pick?: string[] | null; syn?: { n: number; text: string }; runs?: Rec2<number>; chains?: Rec2<number>; seq: number; fresh: number; ev: Ev | null; queue: EnemyCard[]; last: EnemyCard | null; field: Side; foeField: Side; combo: string; played: Record<string, number>; prev: string | null; block: number; draw: string[]; hand: string[]; discard: string[]; energy: number; turn: number; log: string[] }
/** Effetti di una scelta di capitolo che valgono solo per il prossimo duello. */
export interface Boon { block?: number; energy?: number; draw?: number; foeHp?: number; hp?: number }
export interface Run {
  /** Carta misteriosa pagata ma non ancora installata (nessuno slot libero): si risolve con resolvePending. */
  pending?: { id: string; paid: number } | null;
  /** Regione dell'arena corrente (tema e nemici); needsMap: prima di ogni arena si sceglie la regione sulla mappa. */
  region?: string | null; needsMap?: boolean; progress?: Record<string, number>;
  /** Carte vendute singolarmente (uid di carte base o di mosse di equipaggiamento): escluse dalla collezione. */
  god?: boolean; finalEv?: Ev | null; outcome?: string; style?: string; wounded?: boolean; scars?: number;
  sold?: string[]; hero?: { name: string; avatar: string };
  /** Scelte di capitolo: seme dell'ordine degli eventi, scelte già fatte (per capitolo) e bonus/malus per il prossimo duello. */
  cs?: number; chapters?: Record<string, { ev: string; opt: string; gold: number; fx?: ChoiceFx; v?: VirtMap; rk?: Partial<Record<VirtId, [number, number]>> }>; boon?: Boon;
  /** Onore, Fama e Ambizione (se assenti valgono i valori iniziali di config.virtues), flag di storia, fine del viaggio e epilogo già letto. */
  virt?: VirtMap; flags?: string[]; ended?: boolean; epiSeen?: boolean;
  /** Azioni sbloccabili: quelle già spiegate al giocatore (seen) e quelle da spiegare ora (intro, mostrate entrando nell'isola). */
  seen?: string[]; intro?: string[];
  /** Abilità dell'albero acquistate (config.skills). */
  skills?: string[];
  v: 1; rng: number; arena: number; gold: number; hp: number; slots: number;
  equipped: string[]; bought: string[]; retained: string[]; energyBonus: number; offers: Offers; paid: Record<string, number>;
  deck: string[]; phase: Phase; combat: Combat | null; msg: string;
}
type Rec2<T> = { off: T; def: T };
/** Stato delle combo a sequenza di una carta schierata (permette di ricalcolarle quando il campo viene riordinato). cd/cb = quota di danni/guardia dovuta alla combo. */
export interface Cx { g: 'off' | 'def'; link?: { from: string; dmg?: number; block?: number; draw?: number; energy?: number }; mixed: boolean; on: boolean; paid: boolean; n: number; ch: number; cd: number; cb: number }
export interface Placed { lch?: number; rc?: number; cx?: Cx; t?: number; gd?: number; cl?: number; trg?: Trigger; uid: string; name: string; icon: string; src: string; dmg: number; hits: number; block: number; ttl: number; sh?: number; id?: number; mv?: string; fx?: string; tag?: string }
export interface Ev { by: 'me' | 'foe'; card: Placed; absorbed: number; dmg: number }
export interface Side { off: Placed[]; def: Placed[] }
/** Slot 0-1: carte visibili; slot 2: carta MISTERIOSA (id nascosto) a prezzo ridotto (eqPrice/mvPrice). */
export interface Offers { eq: (string | null)[]; mv: (string | null)[]; eqPrice: number; mvPrice: number }
export interface Card { uid: string; move: string }
export function rand(r: Run) { r.rng = (r.rng + 0x6D2B79F5) >>> 0; let t = r.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function shuffle<T>(r: Run, a: T[]) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand(r) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
const styleDeck = (r: Run) => (STYLES.find(x => x.id === (r.style ?? 'boxing')) ?? STYLES[0]).deck;
export function ownedCards(r: Run): Card[] {
  const m = new Map<string, Card>(); const add = (uid: string) => m.set(uid, { uid, move: moveOf(uid) });
  styleDeck(r).forEach((m, i) => add(`base:${m}:${i}`));
  r.equipped.forEach(e => EQUIPMENT[e].moves.forEach((_, i) => add(`eq:${e}:${i}`)));
  r.retained.forEach(add); r.bought.forEach(b => add(`buy:${b}`)); (r.sold ?? []).forEach(u => m.delete(u));
  return [...m.values()];
}
export const maxHp = (r: Run) => CONFIG.startHp + Math.round(CONFIG.hpPerArena * (r.arena - 1)) + r.equipped.reduce((s, e) => s + (EQUIPMENT[e].bonus.maxHp ?? 0), 0);
export const dmgBonus = (r: Run) => r.equipped.reduce((s, e) => s + (EQUIPMENT[e].bonus.dmg ?? 0), 0);
export const maxEnergy = (r: Run) => Math.min(CONFIG.maxEnergy, CONFIG.energyPerTurn + (r.energyBonus ?? 0));
export const energyPrice = (r: Run) => CONFIG.energyPrice(r.energyBonus ?? 0);
/** Estensione energia: +1 energia per turno fino a CONFIG.maxEnergy. DECISIONE APERTA: non rivendibile. */
/** Cambia tutte le offerte dello store (potenziamenti e mosse) pagando CONFIG.rerollCost. */
export function rerollOffers(r: Run): Err {
  if (r.phase !== 'store' || r.needsMap) return 'Store non disponibile.'; if (r.pending) return 'Prima risolvi la carta misteriosa.';
  const p = CONFIG.rerollCost; if (r.gold < p) return 'Oro insufficiente.'; r.gold -= p; genOffers(r); r.msg = 'Offerte rinnovate.'; return null;
}
export function buyEnergy(r: Run): Err {
  if (r.phase !== 'store') return 'Store non disponibile.'; if (maxEnergy(r) >= CONFIG.maxEnergy) return `Energia già al massimo (${CONFIG.maxEnergy}).`;
  const p = energyPrice(r); if (r.gold < p) return 'Oro insufficiente.'; r.gold -= p; r.energyBonus++; return null;
}
/** Valore di vendita di una carta: base = valore fisso; mossa di equipaggiamento = 1/3 del rimborso dell'equipaggiamento; mossa acquistata = rimborso 50%. */
export const cardValue = (r: Run, uid: string) => { const [k, a] = uid.split(':'); return k === 'base' ? CONFIG.cardValueBase : k === 'eq' ? Math.floor(refund(r.paid[a] ?? 0) / 3) : refund(r.paid[a] ?? 0); };
/** Vendita di qualsiasi carta (drag & drop sulla zona vendita), purché nel mazzo restino almeno CONFIG.minDeck carte. */
export function sellCard(r: Run, uid: string): Err {
  if (r.phase !== 'store') return 'Store non disponibile.'; if (!ownedCards(r).some(c => c.uid === uid)) return 'Carta non posseduta.';
  const [k, a] = uid.split(':'); if (k === 'buy') return sellMove(r, a);
  if (r.deck.includes(uid) && r.deck.length <= CONFIG.minDeck) return `Il mazzo deve avere almeno ${CONFIG.minDeck} carte.`;
  r.gold += cardValue(r, uid); r.sold = [...(r.sold ?? []), uid]; sanitize(r); return null;
}
// ---- Offerte dello store: 3 potenziamenti e 3 mosse (delle mosse avanzate degli equipaggiamenti installati), casuali ----
const eligibleMoves = (r: Run) => r.equipped.flatMap(e => EQUIPMENT[e].advanced).filter(m => !r.bought.includes(m));
/** Isola di cui il negozio offre i potenziamenti: solo quella dell'arena corrente (in god mode tutte quelle sbloccate). */
export const storeIsland = (r: Run) => islandIndex(r.region ?? REGION_LIST[0].id);
export const arenaEquipment = (r: Run) => Object.values(EQUIPMENT).filter(e => r.god ? islandIndex(e.island) <= reach(r) : islandIndex(e.island) === storeIsland(r));
export function genOffers(r: Run) {
  const n = CONFIG.offers, fit = (a: string[]): (string | null)[] => { const x: (string | null)[] = shuffle(r, a).slice(0, n); while (x.length < n) x.push(null); return x; };
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const pool = arenaEquipment(r), ids = new Set(pool.map(e => e.id)), pmv = Object.values(MOVES).filter(m => m.price > 0 && ids.has(m.source));
  r.offers = { eq: fit(pool.filter(e => !r.equipped.includes(e.id)).map(e => e.id)), mv: fit(eligibleMoves(r)), eqPrice: Math.round(avg((pool.length ? pool : Object.values(EQUIPMENT)).map(e => e.price)) * CONFIG.mystery), mvPrice: Math.round(avg((pmv.length ? pmv : Object.values(MOVES).filter(m => m.price > 0)).map(m => m.price)) * CONFIG.mystery) };
}
/** Acquisto per offerta (la UI lo chiama dopo il drag & drop). Un equipaggiamento nuovo rende offribili le sue mosse avanzate. */
export function buyOfferEq(r: Run, i: number): Err {
  const id = r.offers.eq[i]; if (!id) return 'Offerta non disponibile.'; if (i === 2 && r.equipped.length >= r.slots) { // nessuno slot: paga e poi scegli se sostituire o scartare
    const p = r.offers.eqPrice; if (r.phase !== 'store') return 'Store non disponibile.'; if (r.gold < p) return 'Oro insufficiente.';
    r.gold -= p; r.pending = { id, paid: p }; r.offers.eq[2] = null; return null;
  }
  const err = buyEquipment(r, id, i === 2 ? r.offers.eqPrice : undefined); if (err) return err;
  r.offers.eq[i] = null; const add = shuffle(r, EQUIPMENT[id].advanced.filter(m => !r.bought.includes(m) && !r.offers.mv.includes(m)));
  r.offers.mv = r.offers.mv.map(m => m ?? add.shift() ?? null); return null;
}
/** PV a inizio duello: sempre pieni, salvo se l'ultimo duello è finito sotto la soglia (allora parti all'80% finché non paghi la cura). */
export const startHp = (r: Run) => r.wounded ? Math.ceil(maxHp(r) * CONFIG.woundedStart) : maxHp(r);
export function healRun(r: Run): Err {
  if (r.phase !== 'store') return 'Store non disponibile.'; if (!r.wounded) return 'Sei già in piena salute.'; if (r.gold < CONFIG.healCost) return 'Oro insufficiente.';
  r.gold -= CONFIG.healCost; r.wounded = false; return null;
}
/** Scelta dello stile di combattimento iniziale: imposta il mazzo base. */
export function setStyle(r: Run, id: string): Err { if (!STYLES.some(x => x.id === id)) return 'Stile sconosciuto.'; r.style = id; r.deck = ownedCards(r).map(c => c.uid); return null; }
export function chooseRegion(r: Run, id: string): Err {
  if (r.phase !== 'store' || !r.needsMap) return 'Non puoi scegliere ora.'; const g = REGIONS[id]; if (!g) return 'Regione sconosciuta.'; if (!unlocked(r).includes(id)) return 'Isola bloccata.';
  const changed = islandIndex(id) !== storeIsland(r); r.region = id; r.needsMap = false; r.msg = `Arena: ${g.name}.`; if (changed) genOffers(r); return null;
}
// ---- Scelte di capitolo ----
const seeded = (seed: number) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function sshuffle<T>(a: T[], seed: number) { const b = [...a], f = seeded(seed); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
/** Un capitolo = un incontro di un'isola; ripetere lo stesso duello (fuga/pietà) non genera una nuova scelta. */
export const chapterKey = (r: Run) => r.region ? `${r.region}:${wins(r, r.region)}` : '';
/** Valore in oro di 1 "unità" di ricompensa: cresce con l'arena (1/3 della vittoria). */

// ---- Onore, Fama, Ambizione ----
export const VIRT_IDS: VirtId[] = ['honor', 'fame', 'ambition'];
export const virtDef = (id: VirtId) => VIRTUES.list.find(x => x.id === id)!;
export const virtOf = (r: Run, id: VirtId) => r.virt?.[id] ?? virtDef(id).start;
/** Livello (0–4) di un valore: soglie in config.virtues.ranks. */
export const rankOf = (v: number) => VIRTUES.ranks.reduce((k, t, i) => (v >= t ? i : k), 0);
export const rankName = (id: VirtId, v: number) => virtDef(id).ranks[rankOf(v)] ?? '';
export const perkOf = (id: VirtId, v: number) => virtDef(id).perks?.[String(rankOf(v))];
/** Somma degli effetti passivi dei livelli attuali delle tre statistiche. */
export function perkFx(r: Run): PerkFx { const o: Record<string, number> = {}; for (const id of VIRT_IDS) { const p = perkOf(id, virtOf(r, id)); if (p) for (const [k, v] of Object.entries(p.fx)) o[k] = (o[k] ?? 0) + (v as number); } return o as PerkFx; }
const flagList = (s?: string) => (s ?? '').split(',').map(x => x.trim()).filter(Boolean);
export const hasFlag = (r: Run, f: string) => !!r.flags?.includes(f);
export function condOk(r: Run, c?: Cond | null): boolean {
  if (!c) return true;
  for (const id of VIRT_IDS) { const v = virtOf(r, id), lo = c.min?.[id], hi = c.max?.[id]; if (lo != null && v < lo) return false; if (hi != null && v > hi) return false; }
  return flagList(c.flag).every(f => hasFlag(r, f)) && !flagList(c.noFlag).some(f => hasFlag(r, f));
}
/** Applica le variazioni (con limiti 0–max); restituisce quanto è cambiato davvero e i cambi di livello. */
function addVirt(r: Run, d: VirtMap) {
  const v: VirtMap = {}, rk: Partial<Record<VirtId, [number, number]>> = {}; r.virt = { ...r.virt };
  for (const id of VIRT_IDS) { const dv = d[id]; if (!dv) continue; const a = virtOf(r, id), b = Math.max(0, Math.min(VIRTUES.max, a + dv)); r.virt[id] = b; if (b !== a) v[id] = b - a; if (rankOf(a) !== rankOf(b)) rk[id] = [rankOf(a), rankOf(b)]; }
  return { v, rk };
}
/** Testo dell'evento: paragrafo base + richiami alle scelte passate che valgono ora. */
export const evParas = (r: Run, ev: ChoiceEv) => [ev.text, ...(ev.extra ?? []).filter(x => condOk(r, x.if)).map(x => x.text)];
/** Epilogo del viaggio: il primo (in ordine) le cui condizioni valgono; con i paragrafi di richiamo. */
export function epilogueOf(r: Run) { const e = EPILOGUES.find(x => !x.id.startsWith('defeat-') && condOk(r, x.needs)); return e ? { title: e.title, paras: [e.text, ...(e.extra ?? []).filter(x => condOk(r, x.if)).map(x => x.text)] } : null; }
/** Epilogo della sconfitta: testo dell'isola in cui sei caduto (epilogo "defeat-<isola>") più le righe comuni sul voto iniziale ("defeat-all"), filtrate dai flag. */
export function defeatOf(r: Run) {
  const e = EPILOGUES.find(x => x.id === `defeat-${r.region}`), all = EPILOGUES.find(x => x.id === 'defeat-all'); if (!e) return null;
  return { title: e.title, paras: [e.text, ...(e.extra ?? []).filter(x => condOk(r, x.if)).map(x => x.text), ...(all?.extra ?? []).filter(x => condOk(r, x.if)).map(x => x.text)] };
}
export const goldUnit = (r: Run) => Math.max(1, Math.round(CONFIG.reward(r.arena) / CONFIG.choice.goldDivisor));
export const choiceGold = (r: Run, fx: ChoiceFx) => Math.round((fx.gold ?? 0) * goldUnit(r));
export interface PendingChoice { key: string; ev: ChoiceEv; options: ChoiceOpt[] }
/** Effetti scalati col livello: scudo e malus ai PV crescono con l'arena (oro e altri effetti no: l'oro usa già goldUnit). */
export function scaledFx(r: Run, fx: ChoiceFx): ChoiceFx {
  const o = { ...fx }, k = (v: number, per: number) => Math.round(v * (1 + per * (r.arena - 1)));
  if (fx.block) o.block = k(fx.block, CONFIG.choice.blockPerArena); if (fx.hp) o.hp = k(fx.hp, CONFIG.choice.hpPerArena); return o;
}
const hashStr = (t: string) => [...t].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
/** Scelta ancora da fare nel capitolo corrente: l'evento appartiene all'isola e all'incontro attuali (se ce n'è più d'uno, ne sceglie uno in base al seme della run, evitando i già visti); opzioni in ordine mescolato. */
export function pendingChoice(r: Run): PendingChoice | null {
  if (r.phase !== 'store' || r.needsMap || !r.region || r.pending || !CHOICES.length) return null;
  const key = chapterKey(r); if (r.chapters?.[key]) return null;
  const at = wins(r, r.region) % CONFIG.matchesPerIsland, cs = (r.cs ?? 1) + hashStr(key);
  const avail = CHOICES.filter(e => condOk(r, e.needs)); let pool = avail.filter(e => e.region === r.region && e.at === at); const special = pool.filter(e => e.needs); if (special.length) pool = special; if (!pool.length) pool = avail.filter(e => e.region === r.region); if (!pool.length) pool = avail; if (!pool.length) pool = CHOICES;
  const used = new Set(Object.values(r.chapters ?? {}).map(c => c.ev)), order = sshuffle(pool, cs), ev = order.find(e => !used.has(e.id)) ?? order[0];
  return { key, ev, options: sshuffle(ev.options, cs * 31 + 7) };
}
export function makeChoice(r: Run, optId: string): Err {
  const p = pendingChoice(r); if (!p) return 'Nessuna scelta in sospeso.'; const o = p.ev.options.find(x => x.id === optId); if (!o) return 'Scelta non valida.'; if (!condOk(r, o.req)) return o.lock ?? 'Questa strada ti è preclusa.';
  const fx = scaledFx(r, o.fx), g = Math.max(-r.gold, choiceGold(r, fx)); r.gold += g;
  const b: Boon = { ...r.boon }; for (const k of ['block', 'energy', 'draw', 'foeHp', 'hp'] as const) if (fx[k]) b[k] = (b[k] ?? 0) + fx[k]!;
  if (Object.values(b).some(Boolean)) r.boon = b; const vr = o.v ? addVirt(r, o.v) : { v: {}, rk: {} }; if (o.flag) r.flags = [...new Set([...(r.flags ?? []), ...flagList(o.flag)])];
  r.chapters = { ...r.chapters, [p.key]: { ev: p.ev.id, opt: o.id, gold: g, fx, ...(Object.keys(vr.v).length ? { v: vr.v } : {}), ...(Object.keys(vr.rk).length ? { rk: vr.rk } : {}) } }; r.msg = o.text; return null;
}
export function openMap(r: Run): Err { if (r.phase !== 'store' || r.pending) return 'Non puoi ora.'; r.needsMap = true; return null; }
export function resolvePending(r: Run, action: 'discard' | 'replace', target?: string): Err {
  const p = r.pending; if (!p) return 'Nessuna carta in sospeso.';
  if (action === 'discard') { r.gold += Math.floor(EQUIPMENT[p.id].price * CONFIG.sellRatio); r.pending = null; return null; }
  if (!target || !r.equipped.includes(target)) return 'Scegli un equipaggiamento da sostituire.';
  const err = sellEquipment(r, target); if (err) return err;
  r.equipped.push(p.id); r.paid[p.id] = p.paid; r.pending = null; autoAdd(r, EQUIPMENT[p.id].moves.map((_, i) => `eq:${p.id}:${i}`));
  const add = shuffle(r, EQUIPMENT[p.id].advanced.filter(m => !r.bought.includes(m) && !r.offers.mv.includes(m))); r.offers.mv = r.offers.mv.map(m => m ?? add.shift() ?? null); return null;
}
export function buyOfferMv(r: Run, i: number): Err { const id = r.offers.mv[i]; if (!id) return 'Offerta non disponibile.'; const err = buyMove(r, id, i === 2 ? r.offers.mvPrice : undefined); if (err) return err; r.offers.mv[i] = null; return null; }
export const slotsFor = (arena: number) => Math.min(CONFIG.maxSlots, CONFIG.startSlots + Math.floor((arena - 1) / CONFIG.slotEveryArenas));
/** Slot equipaggiamento del giocatore: quelli che crescono con l'arena più quelli comprati nell'albero delle abilità. */
export const slotsOf = (r: Run) => slotsFor(r.arena) + skillSum(r, 'slots');
export function newRun(seed = Date.now()): Run {
  const r: Run = { v: 1, cs: Math.imul(seed >>> 0, 2654435761) >>> 0, rng: seed >>> 0, arena: 1, gold: CONFIG.startGold, hp: CONFIG.startHp, slots: CONFIG.startSlots, equipped: [], bought: [], retained: [], energyBonus: 0, offers: { eq: [], mv: [], eqPrice: 0, mvPrice: 0 }, paid: {}, deck: [], phase: 'store', combat: null, msg: 'Preparati: compra equipaggiamento prima della prima arena.' };
  r.deck = ownedCards(r).map(c => c.uid); genOffers(r); r.needsMap = true; return r;
}
export interface EnemyCard { id?: string; name: string; icon: string; dmg: number; hits: number; block: number; heal: number; dur: number }
export const islandIndex = (id: string) => REGION_LIST.findIndex(r => r.id === id);
export const wins = (r: Run, id: string) => r.progress?.[id] ?? 0;
/** Isole sbloccate: la prima sempre; ogni altra dopo CONFIG.matchesPerIsland vittorie sull'isola precedente. */
export const unlocked = (r: Run) => r.god ? REGION_LIST.map(g => g.id) : REGION_LIST.filter((_, i) => i === 0 || wins(r, REGION_LIST[i - 1].id) >= CONFIG.matchesPerIsland).map(g => g.id);
export const reach = (r: Run) => unlocked(r).length - 1;
/** Equipaggiamento nemico: pezzi delle isole fino a quella del nemico; cresce con l'arena (1 + 1 ogni gearEvery). */
export const enemyGear = (a: number, region?: string): string[] => {
  const idx = region ? islandIndex(region) : 99, ids = Object.values(EQUIPMENT).filter(e => islandIndex(e.island) <= idx).map(e => e.id), n = Math.min(ids.length, 1 + Math.floor((a - 1) / CONFIG.enemy.gearEvery));
  return Array.from({ length: n }, (_, i) => ids[(a + i) % ids.length]);
};
export function enemyFor(a: number, region?: string, match = 0): Enemy {
  const E = CONFIG.enemy, rg = REGIONS[region ?? ''], en = rg ? rg.enemies[match % rg.enemies.length] : undefined, gear = enemyGear(a, region);
  const hp = Math.round(E.hpBase * E.hpGrowth ** (a - 1) * (en?.hpMul ?? 1)) + gear.reduce((s, g) => s + (EQUIPMENT[g].bonus.maxHp ?? 0), 0);
  return { name: en ? en.name : `Avversario ${a}`, ...(rg ? { art: rg.id } : {}), ...(en?.id ? { id: en.id } : {}), tier: rg ? rg.level : 'Umano', hp, maxHp: hp, block: 0, gear, atk: Math.round(E.atkBase * E.atkGrowth ** (a - 1) * (en?.atkMul ?? 1)) };
}
// ---- Mazzo ----
function sanitize(r: Run) { const own = new Set(ownedCards(r).map(c => c.uid)); r.deck = r.deck.filter(u => own.has(u)).slice(0, maxDeckOf(r)); }
function autoAdd(r: Run, uids: string[]) { for (const u of uids) if (r.deck.length < maxDeckOf(r) && !r.deck.includes(u)) r.deck.push(u); }
export function toggleDeck(r: Run, uid: string): Err {
  if (r.phase !== 'store') return 'Puoi modificare il mazzo solo nello store.';
  if (!ownedCards(r).some(c => c.uid === uid)) return 'Carta non posseduta.';
  if (r.deck.includes(uid)) { if (r.deck.length <= CONFIG.minDeck) return `Servono almeno ${CONFIG.minDeck} carte.`; r.deck = r.deck.filter(u => u !== uid); return null; }
  if (r.deck.length >= maxDeckOf(r)) return `Mazzo pieno (${maxDeckOf(r)}).`;
  r.deck.push(uid); return null;
}
// ---- Store ed economia ----
const refund = (paid: number) => Math.floor(paid * CONFIG.sellRatio);
export function buyEquipment(r: Run, id: string, price = EQUIPMENT[id]?.price ?? 0): Err {
  const e = EQUIPMENT[id];
  if (r.phase !== 'store') return 'Store non disponibile.'; if (!e) return 'Equipaggiamento sconosciuto.';
  if (r.equipped.includes(id)) return 'Già installato.'; if (r.equipped.length >= r.slots) return 'Nessuno slot libero.';
  if (r.gold < price) return 'Oro insufficiente.';
  r.gold -= price; r.paid[id] = price; r.equipped.push(id);
  autoAdd(r, e.moves.map((_, i) => `eq:${id}:${i}`)); return null;
}
export function sellEquipment(r: Run, id: string): Err {
  if (r.phase !== 'store') return 'Store non disponibile.'; if (!r.equipped.includes(id)) return 'Non posseduto.';
  if (r.deck.filter(u => !u.startsWith(`eq:${id}:`)).length < CONFIG.minDeck) return `Il mazzo deve avere almeno ${CONFIG.minDeck} carte.`;
  r.gold += refund(r.paid[id]); delete r.paid[id]; r.equipped = r.equipped.filter(e => e !== id); r.sold = (r.sold ?? []).filter(u => !u.startsWith(`eq:${id}:`));
  r.retained = [...new Set([...r.retained, ...movesRetainedAfterRemoval(r, id)])]; sanitize(r); return null;
}
export function buyMove(r: Run, id: string, price = MOVES[id]?.price ?? 0): Err {
  const m = MOVES[id];
  if (r.phase !== 'store') return 'Store non disponibile.'; if (!m || m.price <= 0) return 'Mossa non acquistabile.';
  if (!r.equipped.includes(m.source)) return 'Serve l\'equipaggiamento associato.';
  if (r.bought.includes(id)) return 'Già posseduta.'; if (r.gold < price) return 'Oro insufficiente.';
  r.gold -= price; r.paid[id] = price; r.bought.push(id); autoAdd(r, [`buy:${id}`]); return null;
}
export function sellMove(r: Run, id: string): Err {
  if (r.phase !== 'store') return 'Store non disponibile.'; if (!r.bought.includes(id)) return 'Non posseduta.';
  if (r.deck.includes(`buy:${id}`) && r.deck.length <= CONFIG.minDeck) return `Il mazzo deve avere almeno ${CONFIG.minDeck} carte.`;
  r.gold += refund(r.paid[id]); delete r.paid[id]; r.bought = r.bought.filter(b => b !== id); sanitize(r); return null;
}
// ---- Combattimento a campo schierato ----
// Le carte si schierano (non si recuperano): effetti immediati (pesca, energia, cura) al piazzamento,
// danni offensivi risolti a fine turno in ordine di schieramento, difese con durata (turni o finché abbattute).
export function beginArena(r: Run): Err {
  if (r.phase !== 'store') return 'Non sei nello store.'; if (r.pending) return 'Risolvi prima la carta in sospeso.'; sanitize(r);
  if (r.deck.length < CONFIG.minDeck) return `Servono almeno ${CONFIG.minDeck} carte nel mazzo.`;
  r.hp = Math.max(1, startHp(r) + (r.boon?.hp ?? 0) + (scaledFx(r, perkFx(r)).hp ?? 0)); r.wounded = false;
  r.combat = { enemy: enemyFor(r.arena, r.region ?? undefined, wins(r, r.region ?? '') % CONFIG.matchesPerIsland), block: 0, draw: shuffle(r, r.deck), hand: [], discard: [], energy: 0, turn: 0, field: { off: [], def: [] }, foeField: { off: [], def: [] }, played: {}, prev: null, combo: '', phase: 'player', seq: 0, fresh: 0, ev: null, queue: [], last: null, log: ['Lo scontro ha inizio!'] };
  r.phase = 'combat'; r.msg = ''; startTurn(r); applyBoon(r); return null;
}
/** Applica (e consuma) i bonus/malus di una scelta di capitolo all'inizio del duello. */
function applyBoon(r: Run) {
  const c = r.combat, pf = scaledFx(r, perkFx(r)), b: Boon = { ...r.boon }; delete r.boon; if (!c) return; for (const k of ['block', 'energy', 'draw', 'foeHp', 'hp'] as const) if (pf[k]) b[k] = (b[k] ?? 0) + pf[k]!;
  if (!Object.values(b).some(Boolean)) return;
  if (b.foeHp) { c.enemy.maxHp = Math.max(1, Math.round(c.enemy.maxHp * (1 + b.foeHp / 100))); c.enemy.hp = c.enemy.maxHp; }
  if (b.block) c.field.def.push({ uid: '', name: 'Slancio', icon: '🛡️', src: 'Scelta', dmg: 0, hits: 0, block: b.block, ttl: -1, id: ++c.seq });
  if (b.energy) c.energy += b.energy; if (b.draw) drawCards(c, r, b.draw);
}
function drawCards(c: Combat, r: Run, n: number) {
  for (; n > 0 && c.hand.length < maxHandOf(r); n--) { const u = c.draw.pop(); if (!u) break; c.hand.push(u); } // a mazzo finito si pesca solo spendendo energia (drawDiscard), che rimescola gli scarti
}
/** Scala la durata delle difese; quelle scadute o abbattute vanno agli scarti. ttl<0 = finché abbattuta. */
function decay(c: Combat, sh: Placed[]) { sh.forEach(s => { if (s.ttl > 0) s.ttl--; }); return sh.filter(s => { const keep = s.ttl !== 0 && s.block > 0; if (!keep && s.uid) c.discard.push(s.uid); return keep; }); }
/** Le difese schierate assorbono il danno in ordine; restituisce il danno residuo. */
function absorb(c: Combat, sh: Placed[], d: number, onHit?: (p: Placed) => void) {
  const hit: Placed[] = [];
  for (const s of sh) { if (d <= 0) break; const a = Math.min(s.block, d); if (a > 0) hit.push(s); s.block -= a; d -= a; }
  sh.splice(0, sh.length, ...sh.filter(s => { if (s.block > 0) return true; if (s.uid) c.discard.push(s.uid); return false; }));
  if (onHit) hit.forEach(onHit); return d; // chi è stato colpito reagisce (anche se è stato abbattuto dal colpo)
}
// ---- categorie: conteggi, effetti "per ogni carta" e trigger (carte sul campo ed equipaggiamenti) ----
const catMatch = (want: CatOrAny | undefined, have: Cat | undefined) => !want || want === 'any' || want === have;
/** Quante carte della categoria ci sono (nel turno, in mano, sul campo, negli scarti). Chiamare PRIMA di schierare la carta: la carta stessa non conta. */
export function countCat(c: Combat, s: Scale, skip?: string): number {
  let n = 0;
  if (s.where === 'played') { for (const [id, k] of Object.entries(c.played)) if (catMatch(s.cat, MOVES[id]?.cat)) n += k; }
  else if (s.where === 'hand') { for (const u of c.hand) if (u !== skip && catMatch(s.cat, MOVES[moveOf(u)]?.cat)) n++; }
  else if (s.where === 'discard') { for (const u of c.discard) if (catMatch(s.cat, MOVES[moveOf(u)]?.cat)) n++; }
  else for (const p of [...c.field.off, ...c.field.def]) if (p.mv && catMatch(s.cat, MOVES[p.mv]?.cat)) n++;
  return s.max ? Math.min(n, s.max) : n;
}
/** Il nemico è a 0 PV per un effetto fuori dal normale scambio di colpi: si passa alla risoluzione, che chiude il duello con la vittoria. */
const foeDownCheck = (c: Combat) => { if (c.enemy.hp <= 0 && c.phase === 'player') { c.phase = 'resolve'; c.ev = null; } };
/** Danni diretti al nemico (ignorano gli scudi). Le carte sul campo con «cura per danno diretto» (leech) guariscono per ogni punto di danno inflitto. Restituisce il testo per il registro. */
function directDmg(r: Run, c: Combat, n: number): string {
  const d = Math.min(n, Math.max(0, c.enemy.hp)); c.enemy.hp = Math.max(0, c.enemy.hp - n);
  const lc = [...c.field.def, ...c.field.off].reduce((s, p) => s + (p.lch ?? 0), 0), h = Math.min(lc * d, maxHp(r) - r.hp); if (h > 0) r.hp += h;
  return `${n} danni diretti${h > 0 ? `, cura ${h}` : ''}`;
}
/** Metamorfosi: la carta più costosa del mazzo (a parità di costo vale la prima nell'ordine del mazzo; le carte di fuga sono escluse). */
function morphTarget(r: Run): Move | null {
  let best: Move | null = null; for (const u of r.deck) { const mv = MOVES[moveOf(u)]; if (!mv || mv.effect.flee) continue; if (!best || mv.cost > best.cost) best = mv; } return best;
}
/** Gioca n carte casuali dalla pila di pesca, gratis e con tutti i normali effetti (combo, trigger, passive). Le carte che non si possono schierare (campo pieno, fuga, scelta Stratega) tornano nel mazzo al loro posto.
 *  Restituisce quante ne sono state giocate. Massimo 3 livelli di annidamento (carte automatiche che ne giocano altre). */
function autoPlay(r: Run, c: Combat, n: number): number {
  if ((c.auto ?? 0) >= 3) return 0; c.auto = (c.auto ?? 0) + 1; const mods = modsOf(c); let done = 0;
  for (let tries = 0; done < n && tries < n + 8 && c.draw.length; tries++) {
    const i = Math.floor(rand(r) * c.draw.length), uid = c.draw[i], m = MOVES[moveOf(uid)];
    if (!m || m.effect.flee || m.effect.syn?.k === 'scout') continue;
    c.draw.splice(i, 1); c.hand.push(uid); mods.freeNext = true;
    const err = playCard(r, uid);
    if (err) { mods.freeNext = false; const j = c.hand.indexOf(uid); if (j >= 0) c.hand.splice(j, 1); c.draw.splice(i, 0, uid); continue; }
    done++; if (r.phase !== 'combat' || c.phase !== 'player') break;
  }
  c.auto--; return done;
}
/** Fa scattare un trigger (rispettando "max volte per turno"); restituisce false se non è scattato. */
function fire(r: Run, c: Combat, t: Trigger, key: string, who: string): boolean {
  if (t.max) { c.pu ??= {}; if ((c.pu[key] ?? 0) >= t.max) return false; c.pu[key] = (c.pu[key] ?? 0) + 1; }
  const parts: string[] = [];
  if (t.dmg) parts.push(directDmg(r, c, t.dmg));
  if (t.block) { c.block += t.block; parts.push(`+${t.block} guardia`); }
  if (t.heal) { r.hp = Math.min(maxHp(r), r.hp + t.heal); parts.push(`cura ${t.heal}`); }
  if (t.draw) { drawCards(c, r, t.draw); parts.push(`pesca ${t.draw}`); }
  if (t.energy) { c.energy += t.energy; parts.push(`+${t.energy} energia`); }
  if (parts.length) c.log.push(`${who}: ${parts.join(', ')}.`); return true;
}
/** Passive degli equipaggiamenti per un evento (play: solo per carte della categoria indicata). */
function firePassives(r: Run, c: Combat, on: TrigOn, cat?: Cat) {
  for (const e of r.equipped) (EQUIPMENT[e]?.passives ?? []).forEach((t, i) => { if (t.on === on && (on !== 'play' || catMatch(t.cat, cat))) fire(r, c, t, `e:${e}:${i}`, EQUIPMENT[e].name); });
}
/** Trigger delle carte già schierate (difese permanenti) più passive degli equipaggiamenti. `skip` = carta appena giocata (non reagisce a se stessa). */
function fireAll(r: Run, c: Combat, on: 'play' | 'turnStart', cat?: Cat, skip?: number) {
  for (const p of [...c.field.def]) if (p.trg && p.trg.on === on && p.id !== skip && (on !== 'play' || catMatch(p.trg.cat, cat))) fire(r, c, p.trg, `c:${p.id}`, p.name);
  firePassives(r, c, on, cat);
}
/** Bonus (+danni/+guardia) dagli equipaggiamenti alla carta che si sta giocando. */
function boostFor(r: Run, c: Combat, cat?: Cat, consume = true): number { // rispetta "max volte per turno" (consuma una attivazione per ogni carta potenziata; consume=false = solo anteprima)
  let sum = 0;
  for (const e of r.equipped) (EQUIPMENT[e]?.passives ?? []).forEach((t, i) => {
    if (t.on !== 'play' || !t.boost || !catMatch(t.cat, cat)) return;
    if (t.max) { const k = `b:${e}:${i}`; if (((c.pu ?? {})[k] ?? 0) >= t.max) return; if (consume) { c.pu ??= {}; c.pu[k] = (c.pu[k] ?? 0) + 1; } }
    sum += t.boost;
  });
  return sum;
}
function startTurn(r: Run) { const c = r.combat!; c.turn++; const comboBonus = (c.mods?.combos ?? 0) > 0 ? CONFIG.comboDraw : 0; /* almeno una combo nel turno concluso: +carte in questo */ c.field.def = decay(c, c.field.def); c.block = 0; c.combo = ''; c.played = {}; c.prev = null; c.mods = { off: 0, bypass: false, freeNext: false, dupNext: false, combos: 0 }; c.cardCost = {}; c.pu = {}; c.act = {}; delete c.lastUid; c.pick = null; c.lastBy = { off: null, def: null }; c.runs = { off: 0, def: 0 }; c.chains = { off: 0, def: 0 }; c.ev = null; c.energy = maxEnergy(r); c.phase = 'player'; c.foeDealt = 0; drawCards(c, r, c.turn === 1 ? CONFIG.startHand : Math.max(CONFIG.drawPerTurn, CONFIG.handTarget - c.hand.length) + comboBonus); fireAll(r, c, 'turnStart'); foeDownCheck(c); }
/** Scudi attivi del giocatore: guardia delle carte offensive del turno + difese schierate. */
export const shieldsOf = (c: Combat) => c.block + c.field.def.reduce((s, p) => s + p.block, 0);
/** Le carte "Scudo d'assalto" già schierate seguono gli scudi attivi (se ne giochi altri dopo, il loro danno cresce). */
function syncShieldAtk(c: Combat) { const n = shieldsOf(c); c.field.off.forEach(p => { if (p.sh !== undefined) { p.dmg = Math.max(0, p.dmg + n - p.sh); p.sh = n; } }); }
const modsOf = (c: Combat) => c.mods ?? (c.mods = { off: 0, bypass: false, freeNext: false, dupNext: false, combos: 0 });
/** Costo effettivo di una carta in mano: "prossima carta gratis" (Riscaldamento) e sconti del turno (Stratega). */
export const effCost = (c: Combat, uid: string) => c.mods?.freeNext ? 0 : (c.cardCost?.[uid] ?? MOVES[moveOf(uid)].cost);
export function playCard(r: Run, uid: string): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c) return 'Nessun combattimento.'; if (c.phase !== 'player') return 'Non è il tuo turno.';
  if (!c.hand.includes(uid)) return 'Carta non in mano.'; if (c.pick?.length) return 'Scegli prima una carta (Stratega).';
  const mods = modsOf(c), orig = MOVES[moveOf(uid)], morphed = mods.morph ? morphTarget(r) : null, m = morphed ?? orig, f = m.effect, S = f.syn, cost = effCost(c, uid), keep = uid.startsWith('clone:') ? '' : uid; // Metamorfosi: si paga il costo della carta in mano, ma vale l'effetto della carta più costosa del mazzo
  const commitMorph = () => { if (mods.morph) { mods.morph = false; if (morphed && morphed.id !== orig.id) c.log.push(`${orig.name} si trasforma in ${m.name}!`); } };
  const off = !!f.dmg || !!f.scale?.dmg || S?.k === 'momentum' || S?.k === 'shieldAtk', instant = !!S && S.k !== 'momentum' && S.k !== 'flow' && S.k !== 'shieldAtk', row = off ? c.field.off : c.field.def;
  if (f.flee) { // carta di fuga: requisiti di partita, poi si lascia il duello senza conseguenze
    const q = f.req ?? {}; if (q.hpBelow !== undefined && r.hp / maxHp(r) >= q.hpBelow) return `Requisito: PV sotto il ${Math.round(q.hpBelow * 100)}%.`; if (q.minTurn !== undefined && c.turn < q.minTurn) return `Requisito: dal turno ${q.minTurn}.`;
    if (c.energy < cost) return 'Energia insufficiente.'; c.hand.splice(c.hand.indexOf(uid), 1); if (keep) c.discard.push(keep); resolveOutcome(r, 'flee'); return null;
  }
  if (c.energy < cost) return 'Energia insufficiente.';
  if (instant) { // carte sinergia: effetto immediato basato sulle altre carte del turno, non occupano il campo
    if (S!.k === 'clone' && !c.lastUid) return 'Nessuna carta giocata da copiare.'; if (S!.k === 'scout' && !c.draw.length) return 'Il mazzo è finito: nessuna carta da guardare.'; if (S!.k === 'autoplay' && !c.draw.length) return 'Il mazzo è finito: nessuna carta da giocare.';
    c.energy -= cost; mods.freeNext = false; commitMorph(); c.hand.splice(c.hand.indexOf(uid), 1); if (keep) c.discard.push(keep); c.played[m.id] = (c.played[m.id] ?? 0) + 1; let msg = '';
    switch (S!.k) {
      case 'adrenaline': mods.off += S!.n ?? 0; c.field.off.forEach(p => { p.dmg += S!.n ?? 0; }); msg = `+${S!.n} danni a tutte le carte offensive del turno`; break;
      case 'bypass': mods.bypass = true; msg = 'Gli scudi nemici vengono ignorati in questo turno'; break;
      case 'freeNext': mods.freeNext = true; msg = 'La prossima carta costa 0'; break;
      case 'dup': mods.dupNext = true; msg = 'La prossima carta sarà schierata due volte'; break;
      case 'clone': c.hand.push(`clone:${moveOf(c.lastUid!)}:${++c.seq}`); msg = 'Copia dell\'ultima carta aggiunta alla mano'; break;
      case 'scout': c.pick = c.draw.slice(-3).reverse(); msg = 'Scegli una carta tra le prime 3 del mazzo'; break;
      case 'morph': { const t = morphTarget(r); mods.morph = !!t; msg = t ? `La prossima carta diventerà «${t.name}»` : 'Nessuna carta da imitare'; break; }
      case 'autoplay': { const k = autoPlay(r, c, S!.n ?? 2); msg = k ? `Giocate automaticamente ${k} ${k === 1 ? 'carta' : 'carte'} dal mazzo` : 'Nessuna carta giocabile dal mazzo'; break; }
    }
    if (S!.k !== 'autoplay') c.lastUid = morphed ? `clone:${m.id}:${++c.seq}` : uid; c.syn = { n: ++c.seq, text: msg }; c.log.push(`${m.name}: ${msg}.`); return null;
  }
  if (row.length >= CONFIG.rowSize) return `Riga ${off ? 'offensiva' : 'difensiva'} piena.`;
  c.energy -= cost; mods.freeNext = false; commitMorph(); c.hand.splice(c.hand.indexOf(uid), 1);
  const sc = f.scale, sn = sc ? countCat(c, sc) : 0, bst = boostFor(r, c, m.cat); // carte contate PRIMA di schierare questa (non conta se stessa)
  // Combo: valida solo tra carte consecutive DELLO STESSO GENERE (offensive o difensive): una carta dell'altro genere non la interrompe.
  // Comboo = catena di almeno 3 mosse (stessa carta o concatenazione). Le concatenazioni guardano l'ultima carta del genere della carta indicata.
  const g: 'off' | 'def' = off ? 'off' : 'def', L = c.lastBy ?? (c.lastBy = { off: null, def: null }), R = c.runs ?? (c.runs = { off: 0, def: 0 }), C = c.chains ?? (c.chains = { off: 0, def: 0 });
  const same = L[g] === m.id, n = same ? R[g] + 1 : 1, pct = CONFIG.combo.same[Math.min(n, CONFIG.combo.max) - 1] ?? 0, fg: 'off' | 'def' = f.link ? (MOVES[f.link.from]?.effect.dmg ? 'off' : 'def') : g;
  const lk = f.link && L[fg] === f.link.from ? f.link : null, mul = (x: number) => Math.round(x * (1 + pct)), chain = same ? C[g] + 1 : lk ? C[fg] + 1 : 1;
  c.played[m.id] = (c.played[m.id] ?? 0) + 1; R[g] = n; C[g] = chain; L[g] = m.id; c.prev = m.id; c.tier = chain >= 3 ? 2 : chain === 2 ? 1 : 0;
  const total = Object.values(c.played).reduce((a, b) => a + b, 0), dmgBase = (S?.k === 'momentum' ? (S.n ?? 1) * total : S?.k === 'shieldAtk' ? shieldsOf(c) : f.dmg ?? 0) + (sc?.dmg ?? 0) * sn + (off ? bst : 0);
  const preD = dmgBase + dmgBonus(r) + mods.off, preB = (f.block ?? 0) + (sc?.block ?? 0) * sn + (!off && (f.block || sc?.block) ? bst : 0) + (S?.k === 'flow' ? (S.n ?? 0) * mods.combos : 0); // valori prima del moltiplicatore di combo
  const p: Placed = { t: c.turn, uid: keep, name: m.name, icon: '', src: m.source, dmg: off ? mul(preD + (lk?.dmg ?? 0)) : 0, hits: f.hits ?? 1, block: 0, ttl: 1, id: ++c.seq, mv: m.id, ...(f.trigger && !off ? { trg: { ...f.trigger } } : {}), ...(S?.k === 'shieldAtk' ? { sh: shieldsOf(c) } : {}), ...(f.leech ? { lch: f.leech } : {}), ...(f.recallDmg ? { rc: f.recallDmg } : {}) };
  const blk = mul(preB + (lk?.block ?? 0));
  p.cx = { g, link: f.link ? { ...f.link } : undefined, mixed: !!f.link && fg !== g, on: !!lk, paid: !!lk, n, ch: chain, cd: off ? p.dmg - preD : 0, cb: blk - preB }; if (off) p.gd = blk;
  if (chain >= 2) mods.combos++;
  if (off) c.block += blk; else { p.block = blk; p.ttl = f.dur === 0 ? -1 : f.dur ?? 1; } // guardia di una carta offensiva: temporanea
  row.push(p); c.fresh = p.id!; c.log.push(`${m.name} schierata.`);
  const dr = (f.draw ?? 0) + (lk?.draw ?? 0) + (sc?.draw ?? 0) * sn, en = (f.energy ?? 0) + (lk?.energy ?? 0) + (sc?.energy ?? 0) * sn, hl = (f.heal ?? 0) + (sc?.heal ?? 0) * sn, heal = hl ? mul(hl) : 0, fx = () => { if (heal) r.hp = Math.min(maxHp(r), r.hp + heal); if (dr) drawCards(c, r, dr); if (en) c.energy += en; };
  fx();
  if (mods.dupNext) { mods.dupNext = false; if (row.length < CONFIG.rowSize) row.push({ ...p, id: ++c.seq, uid: '', cx: undefined, cl: p.id }); if (off) c.block += blk; fx(); } // Duplicazione: schierata due volte
  const full = !!f.emptyHeal && !c.draw.length; if (full) { r.hp = maxHp(r); c.log.push(`${m.name}: il mazzo è finito, cura completa!`); } // dopo la pesca della carta stessa
  c.lastUid = morphed ? `clone:${m.id}:${++c.seq}` : uid; syncShieldAtk(c); fireAll(r, c, 'play', m.cat, p.id); foeDownCheck(c);
  const tag = [pct ? `${m.name} ×${n} (+${Math.round(pct * 100)}%)` : '', lk ? `${MOVES[lk.from].name} → ${m.name}` : ''].filter(Boolean).join(' · '); c.combo = tag;
  p.fx = [dr && `✦${dr}`, en && `⚡+${en}`, heal && `✚${heal}`, full && '💖MAX', off && blk && `🛡️${blk}`].filter(Boolean).join(' '); p.tag = [pct ? `🔥+${Math.round(pct * 100)}%` : '', lk ? '🔗' : ''].filter(Boolean).join(' ');
  return null;
}
/** Mazzo esaurito: per CONFIG.discardDrawCost energia gli scarti vengono rimescolati nel mazzo e si pesca 1 carta. */
/** Stato di una carta in mano, senza modificare nulla: giocabile ora? potenziata (combo, concatenazione, passiva, "per ogni carta", sinergie)? */
export function cardInfo(r: Run, uid: string): { playable: boolean; boosted: boolean } {
  const c = r.combat; if (r.phase !== 'combat' || !c || c.phase !== 'player' || c.pick?.length || !c.hand.includes(uid)) return { playable: false, boosted: false };
  const mods = modsOf(c), morphed = mods.morph ? morphTarget(r) : null, m = morphed ?? MOVES[moveOf(uid)], f = m.effect, S = f.syn, cost = effCost(c, uid);
  const off = !!f.dmg || !!f.scale?.dmg || S?.k === 'momentum' || S?.k === 'shieldAtk', instant = !!S && S.k !== 'momentum' && S.k !== 'flow' && S.k !== 'shieldAtk';
  let playable = c.energy >= cost;
  if (f.flee) { const q = f.req ?? {}; if ((q.hpBelow !== undefined && r.hp / maxHp(r) >= q.hpBelow) || (q.minTurn !== undefined && c.turn < q.minTurn)) playable = false; }
  else if (instant) { if ((S!.k === 'clone' && !c.lastUid) || (S!.k === 'scout' && !c.draw.length) || (S!.k === 'autoplay' && !c.draw.length)) playable = false; }
  else if ((off ? c.field.off : c.field.def).length >= CONFIG.rowSize) playable = false;
  if (f.flee || instant) return { playable, boosted: playable && (cost < m.cost) };
  const g: 'off' | 'def' = off ? 'off' : 'def', fg: 'off' | 'def' = f.link ? (MOVES[f.link.from]?.effect.dmg ? 'off' : 'def') : g, L = c.lastBy ?? { off: null, def: null }, R = c.runs ?? { off: 0, def: 0 };
  const pct = CONFIG.combo.same[Math.min(L[g] === m.id ? R[g] + 1 : 1, CONFIG.combo.max) - 1] ?? 0, lk = !!f.link && L[fg] === f.link.from, sc = f.scale, sn = sc ? countCat(c, sc, uid) : 0, bst = boostFor(r, c, m.cat, false);
  const boosted = pct > 0 || lk || (!!sc && sn > 0 && !!(sc.dmg || sc.block || sc.draw || sc.energy || sc.heal)) || (bst > 0 && (off || !!f.block || !!sc?.block)) || (off && (mods.off > 0 || !!mods.bypass)) || !!mods.dupNext || cost < m.cost || (!!f.emptyHeal && !c.draw.length);
  return { playable, boosted: playable && boosted };
}
/** God mode: aggiunge qualsiasi carta al mazzo, gratis (una copia per carta; si può rivendere a 0). */
export function godGiveCard(r: Run, id: string): Err {
  if (!r.god) return 'Solo in god mode.'; if (r.phase !== 'store') return 'Store non disponibile.'; if (!MOVES[id]) return 'Carta sconosciuta.'; if (r.bought.includes(id)) return 'Già posseduta.';
  r.paid[id] = 0; r.bought.push(id); autoAdd(r, [`buy:${id}`]); return null;
}
export function drawDiscard(r: Run): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c) return 'Nessun combattimento.'; if (c.phase !== 'player') return 'Non è il tuo turno.'; if (c.pick?.length) return 'Scegli prima una carta (Stratega).';
  if (c.draw.length) return 'Hai ancora carte da pescare nel mazzo.'; if (!c.discard.length) return 'Nessuna carta negli scarti.'; if (c.hand.length >= maxHandOf(r)) return `Mano piena (${maxHandOf(r)}).`; if (c.energy < CONFIG.discardDrawCost) return 'Energia insufficiente.';
  c.energy -= CONFIG.discardDrawCost; c.draw = shuffle(r, c.discard); c.discard = []; drawCards(c, r, CONFIG.discardDrawCards); c.log.push('Mazzo rimescolato: peschi 1 carta.'); return null;
}
// ---- Azioni sbloccabili dall'albero delle abilità (config.actions + config.skills): riprendere una carta dal campo, riordinare il campo, recuperare dagli scarti ----
// ---- Albero delle abilità (config.skills): si comprano con le monete nello store e hanno requisiti minimi di Onore/Fama/Ambizione ----
export interface SkillDef { id: string; branch: string; icon: string; name: string; desc: string; cost: number; needs?: string | string[] | null; pos?: { x: number; y: number }; req?: Partial<Record<VirtId, number>>; fx: { action?: string; deck?: number; hand?: number; slots?: number } }
export const skillDefs = (): SkillDef[] => ((CONFIG as unknown as { skills?: SkillDef[] }).skills ?? []);
export const hasSkill = (r: Run, id: string) => !!r.skills?.includes(id);
/** Abilità che sbloccano questo nodo: basta averne UNA (percorsi alternativi nell'albero). Nessuna = nodo di partenza. */
export const needsOf = (x: SkillDef): string[] => (Array.isArray(x.needs) ? x.needs : x.needs ? [x.needs] : []).filter(Boolean);
export const skillReady = (r: Run, x: SkillDef) => { const n = needsOf(x); return !n.length || n.some(id => hasSkill(r, id)); };
export const skillSum = (r: Run, k: 'deck' | 'hand' | 'slots') => skillDefs().filter(x => hasSkill(r, x.id)).reduce((n, x) => n + (x.fx[k] ?? 0), 0);
/** Massimo di carte del mazzo attivo e in mano (valori base di config + bonus dell'albero). */
export const maxDeckOf = (r: Run) => CONFIG.maxDeck + skillSum(r, 'deck');
export const maxHandOf = (r: Run) => CONFIG.maxHand + skillSum(r, 'hand');
/** Perché un'abilità non si può comprare (null = si può). `story` = scelte di storia attive: solo allora contano i requisiti di Onore/Fama/Ambizione. */
export function skillErr(r: Run, id: string, story = true): Err {
  const x = skillDefs().find(k => k.id === id); if (!x) return 'Abilità sconosciuta.';
  if (r.phase !== 'store') return 'Puoi acquistare abilità solo nello store.'; if (hasSkill(r, id)) return 'Abilità già acquistata.'; if (r.god) return null;
  if (!skillReady(r, x)) { const nm = needsOf(x).map(id => skillDefs().find(k => k.id === id)?.name ?? id); return nm.length > 1 ? `Prima serve una di queste abilità: ${nm.join(' · ')}.` : `Prima serve l'abilità «${nm[0]}».`; }
  if (story) for (const v of VIRT_IDS) { const m = x.req?.[v] ?? 0; if (m > 0 && virtOf(r, v) < m) return `Requisito: ${virtDef(v).name} almeno ${m}.`; }
  if (r.gold < x.cost) return 'Oro insufficiente.'; return null;
}
export function buySkill(r: Run, id: string, story = true): Err {
  const err = skillErr(r, id, story); if (err) return err; const x = skillDefs().find(k => k.id === id)!;
  if (!r.god) r.gold -= x.cost; (r.skills ??= []).push(id); if (x.fx.slots) r.slots += x.fx.slots;
  if (x.fx.action && !r.god && !(r.seen ?? []).includes(x.fx.action)) r.intro = [x.fx.action]; // il popup che spiega la meccanica compare all'acquisto
  r.msg = `Abilità acquistata: ${x.name}.`; return null;
}
/** Fine del viaggio: dopo l'epilogo la run termina (il punteggio si salva nella schermata finale). */
export function finishRun(r: Run): Err { if (!r.ended) return 'Il viaggio non è concluso.'; r.epiSeen = true; r.phase = 'over'; r.combat = null; r.msg = 'Hai concluso il viaggio.'; return null; }
export const ACTION_IDS = ['recall', 'reorder', 'retrieve'] as const;
export type ActionId = typeof ACTION_IDS[number];
/** Un'azione è disponibile dopo aver acquistato nell'albero delle abilità il nodo con fx.action = <id> (in god mode sempre). */
export function actionOn(r: Run, id: ActionId): boolean {
  return !!r.god || skillDefs().some(x => x.fx.action === id && hasSkill(r, x.id));
}
function actGuard(r: Run, id: ActionId): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c) return 'Nessun combattimento.'; if (c.phase !== 'player') return 'Non è il tuo turno.'; if (c.pick?.length) return 'Scegli prima una carta (Stratega).';
  if (!actionOn(r, id)) return 'Azione non ancora sbloccata.';
  const lim = CONFIG.actions[id].perTurn; if (lim && (c.act?.[id] ?? 0) >= lim) return lim === 1 ? 'Puoi farlo una sola volta per turno.' : `Limite di ${lim} volte per turno raggiunto.`;
  return null;
}
const bump = (c: Combat, id: ActionId) => { c.act ??= {}; c.act[id] = (c.act[id] ?? 0) + 1; };
const findPlaced = (c: Combat, id: number): ['off' | 'def', Placed] | null => { for (const g of ['off', 'def'] as const) { const p = c.field[g].find(x => x.id === id); if (p) return [g, p]; } return null; };
/** Raggruppa una riga: una carta duplicata (Duplicazione) segue sempre l'originale. */
const groupsOf = (row: Placed[]) => { const gr: Placed[][] = []; for (const p of row) { const h = p.cl ? gr.find(x => x[0].id === p.cl) : null; if (h) h.push(p); else gr.push([p]); } return gr; };
/** Ricalcola le combo a sequenza (stessa carta ripetuta, concatenazioni tra carte dello stesso genere) delle carte giocate in questo turno nella riga indicata,
 *  dopo un riordino o un ritiro. Le combo miste (offensiva+difensiva) restano quelle ottenute giocando; pesca/energia di una concatenazione si ottengono una sola volta per carta. */
function rebuild(r: Run, c: Combat, g: 'off' | 'def') {
  const row = c.field[g], L = c.lastBy ?? (c.lastBy = { off: null, def: null }), R = c.runs ?? (c.runs = { off: 0, def: 0 }), C = c.chains ?? (c.chains = { off: 0, def: 0 });
  let prev: string | null = null, run = 0, chain = 0;
  for (const p of row) {
    const x = p.cx; if (!x || p.t !== c.turn || p.cl || !p.mv) continue;
    const m = MOVES[p.mv], same = prev === m.id, n = same ? run + 1 : 1, pct = CONFIG.combo.same[Math.min(n, CONFIG.combo.max) - 1] ?? 0;
    const on = x.mixed ? x.on : !!x.link && prev === x.link.from, ch = same ? chain + 1 : on ? (x.mixed ? x.ch : chain + 1) : 1, ld = on ? x.link?.dmg ?? 0 : 0, lb = on ? x.link?.block ?? 0 : 0;
    if (g === 'off') { const pre = p.dmg - x.cd, nd = Math.round((pre + ld) * (1 + pct)) - pre; p.dmg = pre + nd; x.cd = nd; }
    const cur = g === 'off' ? p.gd ?? 0 : p.block, preB = cur - x.cb, nb = Math.round((preB + lb) * (1 + pct)); x.cb = nb - preB;
    if (g === 'off') { c.block += nb - (p.gd ?? 0); p.gd = nb; } else p.block = nb;
    if (on && !x.mixed && !x.paid && x.link) { x.paid = true; if (x.link.draw) drawCards(c, r, x.link.draw); if (x.link.energy) c.energy += x.link.energy; }
    x.on = on; x.n = n; x.ch = ch; p.tag = [pct ? `🔥+${Math.round(pct * 100)}%` : '', on ? '🔗' : ''].filter(Boolean).join(' ');
    prev = m.id; run = n; chain = ch;
  }
  L[g] = prev; R[g] = run; C[g] = chain;
  const all = [...c.field.off, ...c.field.def].filter(p => p.cx && p.t === c.turn && !p.cl), last = all.reduce<Placed | null>((a, p) => !a || (p.id ?? 0) > (a.id ?? 0) ? p : a, null);
  modsOf(c).combos = all.filter(p => p.cx!.ch >= 2).length; c.tier = last ? (last.cx!.ch >= 3 ? 2 : last.cx!.ch === 2 ? 1 : 0) : 0;
  if (last?.cx) { const x = last.cx, pct = CONFIG.combo.same[Math.min(x.n, CONFIG.combo.max) - 1] ?? 0, name = MOVES[last.mv!].name; c.combo = [pct ? `${name} ×${x.n} (+${Math.round(pct * 100)}%)` : '', x.on && x.link ? `${MOVES[x.link.from]?.name ?? ''} → ${name}` : ''].filter(Boolean).join(' · '); } else c.combo = '';
}
/** 1) Riprendi in mano: ritira una carta dal proprio campo e la rimette in mano (l'energia spesa non viene rimborsata). */
export function recallErr(r: Run, id: number): Err {
  const g = actGuard(r, 'recall'); if (g) return g; const c = r.combat!, f = findPlaced(c, id); if (!f) return 'Carta non sul campo.'; if (!f[1].uid) return 'Questa carta non si può rimettere in mano.';
  if (c.hand.length >= maxHandOf(r)) return `Mano piena (${maxHandOf(r)}).`; if (c.energy < (CONFIG.actions.recall.cost ?? 0)) return 'Energia insufficiente.'; return null;
}
/** at = posizione della mano in cui rimettere la carta (la più vicina al punto di rilascio); senza, in fondo. */
export function recallCard(r: Run, id: number, at?: number): Err {
  const e = recallErr(r, id); if (e) return e; const c = r.combat!, [g, p] = findPlaced(c, id)!, row = c.field[g];
  c.energy -= CONFIG.actions.recall.cost ?? 0; bump(c, 'recall');
  if (g === 'off') for (const q of row) if (q.id === id || q.cl === id) c.block = Math.max(0, c.block - (q.gd ?? 0)); // la guardia delle carte offensive del turno se ne va con la carta
  row.splice(0, row.length, ...row.filter(q => q.id !== id && q.cl !== id)); if (at !== undefined && at >= 0 && at < c.hand.length) c.hand.splice(at, 0, p.uid); else c.hand.push(p.uid);
  rebuild(r, c, g); syncShieldAtk(c); c.log.push(`${p.name} rimessa in mano.`);
  if (p.rc) { c.log.push(`${p.name}: ${directDmg(r, c, p.rc)}.`); foeDownCheck(c); } // carte con "quando viene ripresa in mano"
  return null;
}
/** 2) Riordina il campo: scambia una carta schierata in questo turno con la vicina (dir = -1 a sinistra, +1 a destra) e ricalcola le combo a sequenza. */
export function moveErr(r: Run, id: number, dir: -1 | 1): Err {
  const g0 = actGuard(r, 'reorder'); if (g0) return g0; const c = r.combat!, f = findPlaced(c, id); if (!f) return 'Carta non sul campo.';
  const [g, p] = f; if (!p.cx || p.t !== c.turn || p.cl) return 'Puoi riordinare solo le carte schierate in questo turno.';
  const gr = groupsOf(c.field[g]), i = gr.findIndex(x => x[0].id === id), j = i + dir; if (i < 0 || j < 0 || j >= gr.length) return 'Non si può spostare oltre.';
  const q = gr[j][0]; if (!q.cx || q.t !== c.turn) return 'Puoi scambiare solo con carte schierate in questo turno.'; return null;
}
export function moveCard(r: Run, id: number, dir: -1 | 1): Err {
  const e = moveErr(r, id, dir); if (e) return e; const c = r.combat!, [g] = findPlaced(c, id)!, row = c.field[g], gr = groupsOf(row), i = gr.findIndex(x => x[0].id === id), j = i + dir;
  [gr[i], gr[j]] = [gr[j], gr[i]]; row.splice(0, row.length, ...gr.flat()); bump(c, 'reorder'); rebuild(r, c, g); syncShieldAtk(c); c.log.push('Ordine del campo cambiato.'); return null;
}
/** Riordino col trascinamento: sposta la carta (id) davanti alla carta beforeId, oppure in fondo alla riga (beforeId = 0). Un solo spostamento = un uso dell'azione. */
export function moveToErr(r: Run, id: number, beforeId: number): Err {
  const g0 = actGuard(r, 'reorder'); if (g0) return g0; const c = r.combat!, f = findPlaced(c, id); if (!f) return 'Carta non sul campo.';
  const [g, p] = f; if (!p.cx || p.t !== c.turn || p.cl) return 'Puoi riordinare solo le carte schierate in questo turno.';
  const gr = groupsOf(c.field[g]), i = gr.findIndex(x => x[0].id === id), j = beforeId ? gr.findIndex(x => x.some(q => q.id === beforeId)) : gr.length; if (i < 0 || j < 0) return 'Carta non sul campo.';
  if (beforeId && (!gr[j][0].cx || gr[j][0].t !== c.turn)) return 'Puoi spostarla solo tra le carte schierate in questo turno.';
  if ((j > i ? j - 1 : j) === i) return 'È già in questa posizione.'; return null;
}
export function moveCardTo(r: Run, id: number, beforeId: number): Err {
  const e = moveToErr(r, id, beforeId); if (e) return e; const c = r.combat!, [g] = findPlaced(c, id)!, row = c.field[g], gr = groupsOf(row), i = gr.findIndex(x => x[0].id === id), j = beforeId ? gr.findIndex(x => x.some(q => q.id === beforeId)) : gr.length;
  const [x] = gr.splice(i, 1); gr.splice(j > i ? j - 1 : j, 0, x); row.splice(0, row.length, ...gr.flat()); bump(c, 'reorder'); rebuild(r, c, g); syncShieldAtk(c); c.log.push('Ordine del campo cambiato.'); return null;
}
/** 3) Recupera dagli scarti: per config.actions.retrieve.cost energia una carta scelta dagli scarti torna in mano. */
export function retrieveErr(r: Run, uid: string): Err {
  const g = actGuard(r, 'retrieve'); if (g) return g; const c = r.combat!; if (!c.discard.includes(uid)) return 'Carta non negli scarti.';
  if (c.hand.length >= maxHandOf(r)) return `Mano piena (${maxHandOf(r)}).`; if (c.energy < CONFIG.actions.retrieve.cost) return 'Energia insufficiente.'; return null;
}
export function retrieveCard(r: Run, uid: string): Err {
  const e = retrieveErr(r, uid); if (e) return e; const c = r.combat!;
  c.energy -= CONFIG.actions.retrieve.cost; c.discard.splice(c.discard.indexOf(uid), 1); c.hand.push(uid); bump(c, 'retrieve'); c.log.push(`${MOVES[moveOf(uid)].name} recuperata dagli scarti.`); return null;
}
/** Entrando in un'isola si spiegano (una volta per run) le azioni che da lì in poi sono disponibili. */
export function dismissIntro(r: Run): Err { if (r.intro?.length) r.seen = Array.from(new Set([...(r.seen ?? []), ...r.intro])); r.intro = undefined; return null; }
/** Stratega: sceglie una delle 3 carte mostrate; entra in mano e, se giocata nel turno, costa 1. */
export function choosePick(r: Run, uid: string): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c || !c.pick?.length) return 'Nessuna scelta in corso.'; if (!c.pick.includes(uid)) return 'Carta non valida.';
  const i = c.draw.lastIndexOf(uid); if (i >= 0) c.draw.splice(i, 1); c.hand.push(uid); (c.cardCost ?? (c.cardCost = {}))[uid] = 1; c.pick = null; return null;
}
/** Fine turno: risolve gli attacchi schierati (in ordine), poi il nemico prepara le sue carte (giocate una a una da enemyStep). */
export function endTurn(r: Run): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c) return 'Nessun combattimento.'; if (c.phase !== 'player') return 'Non è il tuo turno.';
  if (c.pick?.length) return 'Scegli prima una carta (Stratega).';
  syncShieldAtk(c); c.phase = 'resolve'; c.ev = null; c.log.push('Fine turno: attacchi!'); return null;
}
function prepareEnemy(r: Run, c: Combat) {
  c.foeField.def = decay(c, c.foeField.def);
  const rgn = REGIONS[r.region ?? ''], def = rgn?.enemies.find(x => x.id && x.id === c.enemy.id), ids = def?.moves?.length ? def.moves : rgn?.enemyMoves ?? [];
  const pool = ids.map(id => ENEMY_MOVES.find(m => m.id === id)).filter(Boolean) as typeof ENEMY_MOVES; if (!pool.length) pool.push(...ENEMY_MOVES);
  const E = CONFIG.enemy, n = Math.min(E.playsMax, E.playsBase + Math.floor((r.arena - 1) / E.playsEvery)), base = c.enemy.atk * E.cardMult;
  const avg = pool.reduce((s, m) => s + (m.dmg ?? 0) * (m.hits ?? 1), 0) / pool.length, norm = E.normalize && avg > 0 ? E.normalize / avg : 1; // normalizza: ogni isola infligge in media gli stessi danni per carta, a prescindere dal suo mazzo di mosse
  const k = (x?: number) => x ? Math.max(1, Math.round(base * x)) : 0, kd = (x?: number) => x ? Math.max(1, Math.round(base * norm * x)) : 0, gb = (c.enemy.gear ?? []).reduce((s, g) => s + (EQUIPMENT[g].bonus.dmg ?? 0), 0);
  c.queue = Array.from({ length: n }, () => { const m = pool[Math.floor(rand(r) * pool.length)]; return { id: m.id, name: m.name, icon: m.icon, dmg: m.dmg ? kd(m.dmg) + gb : 0, hits: m.hits ?? 1, block: k(m.block), heal: k(m.heal), dur: m.dur ?? 1 }; });
  c.phase = 'enemy'; c.ev = null; c.last = null; c.log.push('Turno avversario!');
}
/** Un passo del turno nemico: prima schiera UNA carta per volta, poi risolve un attacco per volta; infine inizia il tuo turno. */
export function enemyStep(r: Run): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c || c.phase === 'player') return 'Non è il turno nemico.';
  if (c.phase === 'resolve') { // risoluzione attacchi del giocatore, uno alla volta in ordine di schieramento
    if (c.enemy.hp <= 0) { r.finalEv = c.ev ?? { by: 'me', card: c.field.off[0] ?? { uid: '', name: 'Effetto', icon: '', src: '', dmg: 0, hits: 1, block: 0, ttl: 0 }, absorbed: 0, dmg: 0 }; resolveOutcome(r, 'win'); return null; } // danni diretti (trigger/passive) hanno abbattuto il nemico
    const p = c.field.off.shift(); if (!p) { prepareEnemy(r, c); return null; }
    let abs = 0, dmg = 0; for (let i = 0; i < p.hits; i++) { const left = c.mods?.bypass ? p.dmg : absorb(c, c.foeField.def, p.dmg); abs += p.dmg - left; dmg += left; c.enemy.hp = Math.max(0, c.enemy.hp - left); }
    if (p.uid) c.discard.push(p.uid); c.ev = { by: 'me', card: p, absorbed: abs, dmg }; c.log.push(`${p.name}: ${dmg} danni${abs ? ` (${abs} assorbiti)` : ''}.`);
    if (c.enemy.hp <= 0) { r.finalEv = c.ev; resolveOutcome(r, 'win'); } return null;
  }
  const x = c.queue.shift();
  if (x) {
    c.last = x; c.enemy.hp = Math.min(c.enemy.maxHp, c.enemy.hp + x.heal);
    const p: Placed = { id: ++c.seq, fx: x.heal ? `✚${x.heal}` : '', uid: '', name: x.name, icon: x.icon, src: 'enemy:' + (x.id ?? ''), dmg: x.dmg, hits: x.hits, block: x.block, ttl: x.dur === 0 ? -1 : x.dur };
    if (x.dmg) c.foeField.off.push({ ...p, block: 0, ttl: 1 }); if (x.block) c.foeField.def.push({ ...p, id: x.dmg ? ++c.seq : p.id, dmg: 0, hits: 1 });
    c.fresh = p.id!; c.ev = null; c.log.push(`${x.name} schierata dal nemico.`); return null;
  }
  const a = c.foeField.off.shift();
  if (a) {
    let abs = 0, dmg = 0; for (let i = 0; i < a.hits; i++) { const t = Math.min(c.block, a.dmg); c.block -= t; let left = absorb(c, c.field.def, a.dmg - t, q => { if (q.trg?.on === 'hit') fire(r, c, q.trg, `c:${q.id}`, q.name); }); if (CONFIG.enemy.burstCap) left = Math.max(0, Math.min(left, Math.round(CONFIG.enemy.burstCap * maxHp(r)) - (c.foeDealt ?? 0))); c.foeDealt = (c.foeDealt ?? 0) + left; abs += a.dmg - left; dmg += left; r.hp = Math.max(0, r.hp - left); if (left > 0 && r.hp > 0) firePassives(r, c, 'hit'); }
    c.last = null; c.ev = { by: 'foe', card: a, absorbed: abs, dmg }; c.log.push(`${a.name}: ${dmg} danni${abs ? ` (${abs} assorbiti)` : ''}.`); if (r.hp <= 0) { r.finalEv = c.ev; resolveOutcome(r, 'lose'); } else if (c.enemy.hp <= 0) { r.finalEv = c.ev; resolveOutcome(r, 'win'); } return null;
  }
  startTurn(r); return null;
}
/** Chiedere pietà: con probabilità (base + bonus a PV bassi - malus boss) il nemico ti risparmia; altrimenti il tuo turno finisce e il duello continua. */
export function askMercy(r: Run): { err: Err; spared: boolean } {
  const c = r.combat; if (r.phase !== 'combat' || !c) return { err: 'Nessun combattimento.', spared: false }; if (c.phase !== 'player') return { err: 'Non è il tuo turno.', spared: false };
  if (c.mercy) return { err: 'Hai già chiesto pietà in questo duello.', spared: false }; c.mercy = true;
  const M = CONFIG.mercy, boss = !!r.region && wins(r, r.region) % CONFIG.matchesPerIsland === CONFIG.matchesPerIsland - 1, p = Math.min(0.9, Math.max(0.1, M.base + M.lowHpBonus * (1 - r.hp / maxHp(r)) - (boss ? M.bossPenalty : 0)));
  if (rand(r) < p) { resolveOutcome(r, 'spared'); return { err: null, spared: true }; }
  c.log.push('Nessuna pietà!'); endTurn(r); return { err: null, spared: false };
}
/** Chiudere un duello (vittoria o pietà) sotto la soglia di salute lascia una cicatrice permanente (anche se poi ci si cura), fino a CONFIG.maxScars. */
function scar(r: Run) { if (r.wounded && (r.scars ?? 0) < CONFIG.maxScars) { r.scars = (r.scars ?? 0) + 1; r.msg += ' Ti resterà una cicatrice.'; } }
/** Punto unico di gestione degli esiti: qui si aggiungeranno risparmio/fuga/sopravvivenza. */
export function resolveOutcome(r: Run, res: 'win' | 'lose' | 'flee' | 'spared') {
  if (res === 'win') {
    const g = Math.max(0, Math.round(CONFIG.reward(r.arena) * (1 + (perkFx(r).goldPct ?? 0) / 100))); r.gold += g; r.msg = `Vittoria! +${g} oro.`; r.outcome = 'win';
    if (r.region) { r.progress = { ...r.progress, [r.region]: wins(r, r.region) + 1 }; const nx = REGION_LIST[islandIndex(r.region) + 1]; if (wins(r, r.region) === CONFIG.matchesPerIsland && nx) r.msg += ` Isola completata: si sblocca ${nx.name}!`; }
    if (!r.ended && REGION_LIST.every(g => wins(r, g.id) >= CONFIG.matchesPerIsland)) r.ended = true;
    r.wounded = r.hp / maxHp(r) < CONFIG.woundedBelow; r.arena++; r.slots = slotsOf(r); scar(r); r.phase = 'store'; genOffers(r); r.needsMap = !r.region || wins(r, r.region) >= CONFIG.matchesPerIsland;
  } else if (res === 'flee' || res === 'spared') { // fuga (nessuna conseguenza) o pietà accettata (soldi dimezzati): si torna alla storia e il duello si ripete
    r.outcome = res; if (res === 'spared') r.gold = Math.floor(r.gold / 2); r.wounded = r.hp / maxHp(r) < CONFIG.woundedBelow; r.phase = 'store'; r.needsMap = false;
    r.msg = res === 'flee' ? 'Sei fuggito dal duello: nessuna conseguenza.' : 'Vieni risparmiato… ma ti portano via metà dei soldi.'; if (res === 'spared') scar(r);
  } else if (defeatOutcome(r) === 'end-run') { r.phase = 'over'; r.msg = 'Sei stato sconfitto.'; }
  r.combat = null;
}
