import { CONFIG } from './config';
import { ENEMY_MOVES, EQUIPMENT, MOVES, STYLES, moveOf } from './data';
import { REGION_LIST, REGIONS } from './regions';
import { defeatOutcome, movesRetainedAfterRemoval } from './policies';
export type Phase = 'store' | 'combat' | 'over';
export type Err = string | null;
export interface Enemy { name: string; tier: string; hp: number; maxHp: number; block: number; gear: string[]; art?: string; atk: number }
export interface Combat { enemy: Enemy; phase: 'player' | 'resolve' | 'enemy'; mercy?: boolean; tier?: number; seq: number; fresh: number; ev: Ev | null; queue: EnemyCard[]; last: EnemyCard | null; field: Side; foeField: Side; combo: string; played: Record<string, number>; prev: string | null; block: number; draw: string[]; hand: string[]; discard: string[]; energy: number; turn: number; log: string[] }
export interface Run {
  /** Carta misteriosa pagata ma non ancora installata (nessuno slot libero): si risolve con resolvePending. */
  pending?: { id: string; paid: number } | null;
  /** Regione dell'arena corrente (tema e nemici); needsMap: prima di ogni arena si sceglie la regione sulla mappa. */
  region?: string | null; needsMap?: boolean; progress?: Record<string, number>;
  /** Carte vendute singolarmente (uid di carte base o di mosse di equipaggiamento): escluse dalla collezione. */
  god?: boolean; finalEv?: Ev | null; outcome?: string; style?: string; wounded?: boolean;
  sold?: string[]; hero?: { name: string; avatar: string };
  v: 1; rng: number; arena: number; gold: number; hp: number; slots: number;
  equipped: string[]; bought: string[]; retained: string[]; energyBonus: number; offers: Offers; paid: Record<string, number>;
  deck: string[]; phase: Phase; combat: Combat | null; msg: string;
}
export interface Placed { uid: string; name: string; icon: string; src: string; dmg: number; hits: number; block: number; ttl: number; id?: number; mv?: string; fx?: string; tag?: string }
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
export const maxHp = (r: Run) => CONFIG.startHp + r.equipped.reduce((s, e) => s + (EQUIPMENT[e].bonus.maxHp ?? 0), 0);
export const dmgBonus = (r: Run) => r.equipped.reduce((s, e) => s + (EQUIPMENT[e].bonus.dmg ?? 0), 0);
export const maxEnergy = (r: Run) => Math.min(CONFIG.maxEnergy, CONFIG.energyPerTurn + (r.energyBonus ?? 0));
export const energyPrice = (r: Run) => CONFIG.energyPrice(r.energyBonus ?? 0);
/** Estensione energia: +1 energia per turno fino a CONFIG.maxEnergy. DECISIONE APERTA: non rivendibile. */
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
export function genOffers(r: Run) {
  const n = CONFIG.offers, fit = (a: string[]): (string | null)[] => { const x: (string | null)[] = shuffle(r, a).slice(0, n); while (x.length < n) x.push(null); return x; };
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  r.offers = { eq: fit(Object.values(EQUIPMENT).filter(e => islandIndex(e.island) <= reach(r) && !r.equipped.includes(e.id)).map(e => e.id)), mv: fit(eligibleMoves(r)), eqPrice: Math.round(avg(Object.values(EQUIPMENT).map(e => e.price)) * CONFIG.mystery), mvPrice: Math.round(avg(Object.values(MOVES).filter(m => m.price > 0).map(m => m.price)) * CONFIG.mystery) };
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
/** Slot machine iniziale: assegna lo stile di combattimento e il relativo mazzo base. */
export function rollStyle(r: Run): string { r.style = STYLES[Math.floor(rand(r) * STYLES.length)].id; r.deck = ownedCards(r).map(c => c.uid); return r.style; }
export function chooseRegion(r: Run, id: string): Err {
  if (r.phase !== 'store' || !r.needsMap) return 'Non puoi scegliere ora.'; const g = REGIONS[id]; if (!g) return 'Regione sconosciuta.'; if (!unlocked(r).includes(id)) return 'Isola bloccata.';
  r.region = id; r.needsMap = false; r.msg = `Arena: ${g.name}.`; return null;
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
export function newRun(seed = Date.now()): Run {
  const r: Run = { v: 1, rng: seed >>> 0, arena: 1, gold: CONFIG.startGold, hp: CONFIG.startHp, slots: CONFIG.startSlots, equipped: [], bought: [], retained: [], energyBonus: 0, offers: { eq: [], mv: [], eqPrice: 0, mvPrice: 0 }, paid: {}, deck: [], phase: 'store', combat: null, msg: 'Preparati: compra equipaggiamento prima della prima arena.' };
  r.deck = ownedCards(r).map(c => c.uid); genOffers(r); r.needsMap = true; return r;
}
export interface EnemyCard { name: string; icon: string; dmg: number; hits: number; block: number; heal: number; dur: number }
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
  return { name: en ? en.name : `Avversario ${a}`, ...(rg ? { art: rg.id } : {}), tier: rg ? rg.level : 'Umano', hp, maxHp: hp, block: 0, gear, atk: Math.round(E.atkBase * E.atkGrowth ** (a - 1) * (en?.atkMul ?? 1)) };
}
// ---- Mazzo ----
function sanitize(r: Run) { const own = new Set(ownedCards(r).map(c => c.uid)); r.deck = r.deck.filter(u => own.has(u)).slice(0, CONFIG.maxDeck); }
function autoAdd(r: Run, uids: string[]) { for (const u of uids) if (r.deck.length < CONFIG.maxDeck && !r.deck.includes(u)) r.deck.push(u); }
export function toggleDeck(r: Run, uid: string): Err {
  if (r.phase !== 'store') return 'Puoi modificare il mazzo solo nello store.';
  if (!ownedCards(r).some(c => c.uid === uid)) return 'Carta non posseduta.';
  if (r.deck.includes(uid)) { if (r.deck.length <= CONFIG.minDeck) return `Servono almeno ${CONFIG.minDeck} carte.`; r.deck = r.deck.filter(u => u !== uid); return null; }
  if (r.deck.length >= CONFIG.maxDeck) return `Mazzo pieno (${CONFIG.maxDeck}).`;
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
  r.hp = startHp(r); r.wounded = false;
  r.combat = { enemy: enemyFor(r.arena, r.region ?? undefined, wins(r, r.region ?? '') % CONFIG.matchesPerIsland), block: 0, draw: shuffle(r, r.deck), hand: [], discard: [], energy: 0, turn: 0, field: { off: [], def: [] }, foeField: { off: [], def: [] }, played: {}, prev: null, combo: '', phase: 'player', seq: 0, fresh: 0, ev: null, queue: [], last: null, log: ['Lo scontro ha inizio!'] };
  r.phase = 'combat'; r.msg = ''; startTurn(r); return null;
}
function drawCards(c: Combat, r: Run, n: number) {
  for (; n > 0 && c.hand.length < CONFIG.maxHand; n--) { if (!c.draw.length) { c.draw = shuffle(r, c.discard); c.discard = []; } const u = c.draw.pop(); if (!u) break; c.hand.push(u); }
}
/** Scala la durata delle difese; quelle scadute o abbattute vanno agli scarti. ttl<0 = finché abbattuta. */
function decay(c: Combat, sh: Placed[]) { sh.forEach(s => { if (s.ttl > 0) s.ttl--; }); return sh.filter(s => { const keep = s.ttl !== 0 && s.block > 0; if (!keep && s.uid) c.discard.push(s.uid); return keep; }); }
/** Le difese schierate assorbono il danno in ordine; restituisce il danno residuo. */
function absorb(c: Combat, sh: Placed[], d: number) {
  for (const s of sh) { if (d <= 0) break; const a = Math.min(s.block, d); s.block -= a; d -= a; }
  sh.splice(0, sh.length, ...sh.filter(s => { if (s.block > 0) return true; if (s.uid) c.discard.push(s.uid); return false; })); return d;
}
function startTurn(r: Run) { const c = r.combat!; c.turn++; c.field.def = decay(c, c.field.def); c.block = 0; c.combo = ''; c.played = {}; c.prev = null; c.ev = null; c.energy = maxEnergy(r); c.phase = 'player'; drawCards(c, r, c.turn === 1 ? CONFIG.startHand : CONFIG.drawPerTurn); }
export function playCard(r: Run, uid: string): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c) return 'Nessun combattimento.'; if (c.phase !== 'player') return 'Non è il tuo turno.';
  if (!c.hand.includes(uid)) return 'Carta non in mano.';
  const m = MOVES[moveOf(uid)], f = m.effect, off = !!f.dmg, row = off ? c.field.off : c.field.def;
  if (f.flee) { // carta di fuga: requisiti di partita, poi si lascia il duello senza conseguenze
    const q = f.req ?? {}; if (q.hpBelow !== undefined && r.hp / maxHp(r) >= q.hpBelow) return `Requisito: PV sotto il ${Math.round(q.hpBelow * 100)}%.`; if (q.minTurn !== undefined && c.turn < q.minTurn) return `Requisito: dal turno ${q.minTurn}.`;
    if (c.energy < m.cost) return 'Energia insufficiente.'; c.hand.splice(c.hand.indexOf(uid), 1); c.discard.push(uid); resolveOutcome(r, 'flee'); return null;
  }
  if (c.energy < m.cost) return 'Energia insufficiente.'; if (row.length >= CONFIG.rowSize) return `Riga ${off ? 'offensiva' : 'difensiva'} piena.`;
  c.energy -= m.cost; c.hand.splice(c.hand.indexOf(uid), 1);
  // Combo base (stessa carta nel round) e concatenazione (carta precedente indicata): calcolate in ordine di schieramento.
  const n = (c.played[m.id] ?? 0) + 1, pct = CONFIG.combo.same[Math.min(n, CONFIG.combo.max) - 1] ?? 0, lk = f.link && c.prev === f.link.from ? f.link : null, mul = (x: number) => Math.round(x * (1 + pct));
  c.played[m.id] = n; c.prev = m.id; c.tier = n >= 3 ? 2 : (pct || lk) ? 1 : 0;
  const p: Placed = { uid, name: m.name, icon: '', src: m.source, dmg: off ? mul(f.dmg! + dmgBonus(r) + (lk?.dmg ?? 0)) : 0, hits: f.hits ?? 1, block: 0, ttl: 1, id: ++c.seq, mv: m.id };
  const blk = mul((f.block ?? 0) + (lk?.block ?? 0));
  if (off) c.block += blk; else { p.block = blk; p.ttl = f.dur === 0 ? -1 : f.dur ?? 1; } // guardia di una carta offensiva: temporanea
  row.push(p); c.fresh = p.id!; c.log.push(`${m.name} schierata.`);
  if (f.heal) r.hp = Math.min(maxHp(r), r.hp + mul(f.heal));
  const dr = (f.draw ?? 0) + (lk?.draw ?? 0); if (dr) drawCards(c, r, dr); const en = (f.energy ?? 0) + (lk?.energy ?? 0); if (en) c.energy += en;
  const tag = [pct ? `${m.name} ×${n} (+${Math.round(pct * 100)}%)` : '', lk ? `${MOVES[lk.from].name} → ${m.name}` : ''].filter(Boolean).join(' · '); if (tag) c.combo = tag;
  p.fx = [dr && `✦${dr}`, en && `⚡+${en}`, f.heal && `✚${mul(f.heal)}`, off && blk && `🛡️${blk}`].filter(Boolean).join(' '); p.tag = [pct ? `🔥+${Math.round(pct * 100)}%` : '', lk ? '🔗' : ''].filter(Boolean).join(' ');
  return null;
}
/** Fine turno: risolve gli attacchi schierati (in ordine), poi il nemico prepara le sue carte (giocate una a una da enemyStep). */
export function endTurn(r: Run): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c) return 'Nessun combattimento.'; if (c.phase !== 'player') return 'Non è il tuo turno.';
  c.phase = 'resolve'; c.ev = null; c.log.push('Fine turno: attacchi!'); return null;
}
function prepareEnemy(r: Run, c: Combat) {
  c.foeField.def = decay(c, c.foeField.def);
  const pool = (REGIONS[r.region ?? '']?.enemyMoves ?? []).map(id => ENEMY_MOVES.find(m => m.id === id)).filter(Boolean) as typeof ENEMY_MOVES; if (!pool.length) pool.push(...ENEMY_MOVES);
  const E = CONFIG.enemy, n = Math.min(E.playsMax, E.playsBase + Math.floor((r.arena - 1) / E.playsEvery)), base = c.enemy.atk * E.cardMult;
  const k = (x?: number) => x ? Math.max(1, Math.round(base * x)) : 0, gb = (c.enemy.gear ?? []).reduce((s, g) => s + (EQUIPMENT[g].bonus.dmg ?? 0), 0);
  c.queue = Array.from({ length: n }, () => { const m = pool[Math.floor(rand(r) * pool.length)]; return { name: m.name, icon: m.icon, dmg: m.dmg ? k(m.dmg) + gb : 0, hits: m.hits ?? 1, block: k(m.block), heal: k(m.heal), dur: m.dur ?? 1 }; });
  c.phase = 'enemy'; c.ev = null; c.last = null; c.log.push('Turno avversario!');
}
/** Un passo del turno nemico: prima schiera UNA carta per volta, poi risolve un attacco per volta; infine inizia il tuo turno. */
export function enemyStep(r: Run): Err {
  const c = r.combat; if (r.phase !== 'combat' || !c || c.phase === 'player') return 'Non è il turno nemico.';
  if (c.phase === 'resolve') { // risoluzione attacchi del giocatore, uno alla volta in ordine di schieramento
    const p = c.field.off.shift(); if (!p) { prepareEnemy(r, c); return null; }
    let abs = 0, dmg = 0; for (let i = 0; i < p.hits; i++) { const left = absorb(c, c.foeField.def, p.dmg); abs += p.dmg - left; dmg += left; c.enemy.hp = Math.max(0, c.enemy.hp - left); }
    c.discard.push(p.uid); c.ev = { by: 'me', card: p, absorbed: abs, dmg }; c.log.push(`${p.name}: ${dmg} danni${abs ? ` (${abs} assorbiti)` : ''}.`);
    if (c.enemy.hp <= 0) { r.finalEv = c.ev; resolveOutcome(r, 'win'); } return null;
  }
  const x = c.queue.shift();
  if (x) {
    c.last = x; c.enemy.hp = Math.min(c.enemy.maxHp, c.enemy.hp + x.heal);
    const p: Placed = { id: ++c.seq, fx: x.heal ? `✚${x.heal}` : '', uid: '', name: x.name, icon: x.icon, src: '', dmg: x.dmg, hits: x.hits, block: x.block, ttl: x.dur === 0 ? -1 : x.dur };
    if (x.dmg) c.foeField.off.push({ ...p, block: 0, ttl: 1 }); else if (x.block) c.foeField.def.push({ ...p, dmg: 0, hits: 1 });
    c.fresh = p.id!; c.ev = null; c.log.push(`${x.name} schierata dal nemico.`); return null;
  }
  const a = c.foeField.off.shift();
  if (a) {
    let abs = 0, dmg = 0; for (let i = 0; i < a.hits; i++) { const t = Math.min(c.block, a.dmg); c.block -= t; const left = absorb(c, c.field.def, a.dmg - t); abs += a.dmg - left; dmg += left; r.hp = Math.max(0, r.hp - left); }
    c.last = null; c.ev = { by: 'foe', card: a, absorbed: abs, dmg }; c.log.push(`${a.name}: ${dmg} danni${abs ? ` (${abs} assorbiti)` : ''}.`); if (r.hp <= 0) { r.finalEv = c.ev; resolveOutcome(r, 'lose'); } return null;
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
/** Punto unico di gestione degli esiti: qui si aggiungeranno risparmio/fuga/sopravvivenza. */
export function resolveOutcome(r: Run, res: 'win' | 'lose' | 'flee' | 'spared') {
  if (res === 'win') {
    const g = CONFIG.reward(r.arena); r.gold += g; r.msg = `Vittoria! +${g} oro.`; r.outcome = 'win';
    if (r.region) { r.progress = { ...r.progress, [r.region]: wins(r, r.region) + 1 }; const nx = REGION_LIST[islandIndex(r.region) + 1]; if (wins(r, r.region) === CONFIG.matchesPerIsland && nx) r.msg += ` Isola completata: si sblocca ${nx.name}!`; }
    r.arena++; r.slots = slotsFor(r.arena);
    r.wounded = r.hp / maxHp(r) < CONFIG.woundedBelow; r.phase = 'store'; genOffers(r); r.needsMap = !r.region || wins(r, r.region) >= CONFIG.matchesPerIsland;
  } else if (res === 'flee' || res === 'spared') { // fuga (nessuna conseguenza) o pietà accettata (soldi dimezzati): si torna alla storia e il duello si ripete
    r.outcome = res; if (res === 'spared') r.gold = Math.floor(r.gold / 2); r.wounded = r.hp / maxHp(r) < CONFIG.woundedBelow; r.phase = 'store'; r.needsMap = false;
    r.msg = res === 'flee' ? 'Sei fuggito dal duello: nessuna conseguenza.' : 'Vieni risparmiato… ma ti portano via metà dei soldi.';
  } else if (defeatOutcome(r) === 'end-run') { r.phase = 'over'; r.msg = 'Sei stato sconfitto.'; }
  r.combat = null;
}
