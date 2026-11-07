import { CONFIG } from './config';
// Dati di gioco (carte, equipaggiamenti). Aggiungere contenuti = aggiungere righe qui.
export interface Link { from: string; dmg?: number; block?: number; draw?: number; energy?: number }
/** Categorie delle carte schierabili (come i tipi di creatura di Hearthstone): molte carte ed equipaggiamenti reagiscono ad esse. */
export const CATS = ['melee', 'blade', 'firearm', 'magic'] as const;
export type Cat = typeof CATS[number];
export type CatOrAny = Cat | 'any';
export const CAT_INFO: Record<Cat, { icon: string; name: string }> = { melee: { icon: '🥊', name: 'Corpo a corpo' }, blade: { icon: '🗡️', name: 'Lame' }, firearm: { icon: '🔫', name: 'Armi da fuoco' }, magic: { icon: '✨', name: 'Magia' } };
export const catLabel = (c: Cat | undefined) => c && CAT_INFO[c] ? `${CAT_INFO[c].icon} ${CAT_INFO[c].name}` : '';
/** Dove si contano le carte di una categoria: giocate nel turno (fin qui), in mano, sul campo (schierate), negli scarti. */
export type Where = 'played' | 'hand' | 'field' | 'discard';
export const WHERES: Where[] = ['played', 'hand', 'field', 'discard'];
/** Bonus per ogni carta della categoria contata (la carta stessa è esclusa). `max` = tetto al numero di carte contate. */
export interface Scale { cat: CatOrAny; where: Where; dmg?: number; block?: number; draw?: number; energy?: number; heal?: number; max?: number }
/** Effetto che scatta quando: la carta viene colpita (hit), si gioca una carta (play, con filtro di categoria), inizia il tuo turno (turnStart).
 *  dmg = danni diretti al nemico (ignorano gli scudi); boost = (solo equipaggiamenti, on: play) +N alla carta giocata; max = volte per turno. */
export type TrigOn = 'hit' | 'play' | 'turnStart';
export const TRIG_ON: TrigOn[] = ['hit', 'play', 'turnStart'];
export interface Trigger { on: TrigOn; cat?: CatOrAny; dmg?: number; block?: number; heal?: number; draw?: number; energy?: number; boost?: number; max?: number }
export interface Effect { scale?: Scale; trigger?: Trigger; dmg?: number; block?: number; heal?: number; draw?: number; hits?: number; link?: Link; dur?: number; flee?: boolean; syn?: { k: string; n?: number }; req?: { hpBelow?: number; minTurn?: number }; energy?: number }
export interface Move { cat: Cat; id: string; name: string; desc: string; cost: number; source: string; price: number; effect: Effect }
export interface Equipment {
  kind: string;  // natura dell'oggetto (gear, implant, body, style, arcane): determina il racconto di come lo si ottiene
  island: string;  // isola da cui il potenziamento compare nello store
  id: string; name: string; desc: string; price: number;
  moves: [string, string, string];   // 3 mosse sbloccate
  advanced: string[];                // mosse acquistabili nello store se installato
  bonus: { dmg?: number; maxHp?: number };
  passives: Trigger[];               // effetti passivi per tutto il duello (carte per categoria, colpi subiti…)
}
const linkText = (l: Link) => [l.dmg && `+${l.dmg} danni`, l.block && `+${l.block} guardia`, l.draw && `pesca +${l.draw}`, l.energy && `+${l.energy} energia`].filter(Boolean).join(', ');
const scaleP = (s?: Scale) => s ? ((s.dmg ?? 0) * 2 + (s.block ?? 0) * 1.5 + (s.draw ?? 0) * 3 + (s.energy ?? 0) * 4 + (s.heal ?? 0) * 2.5) : 0; // si assumono ~2 carte contate
const trigP = (t?: Trigger) => t ? ((t.dmg ?? 0) * 2 + (t.block ?? 0) * 2 + (t.heal ?? 0) * 2 + (t.draw ?? 0) * 3 + (t.energy ?? 0) * 4) * (t.max ? Math.min(2, t.max) : 2) : 0; // si assumono ~2 attivazioni
const power = (e: Effect) => (e.dmg ?? 0) * (e.hits ?? 1) + (e.link?.dmg ?? 0) * 0.5 + (e.link?.block ?? 0) * 0.5 + (e.link?.draw ?? 0) * 1.5 + (e.link?.energy ?? 0) * 2 + (e.block ?? 0) * (e.dur === 0 ? 2.5 : 1 + ((e.dur ?? 1) - 1) * 0.4) + (e.heal ?? 0) * 1.3 + (e.draw ?? 0) * 3 + (e.energy ?? 0) * 4 + scaleP(e.scale) + trigP(e.trigger);
/** Costo di energia derivato dalla forza della carta (formula in CONFIG.cost). */
export const costOf = (e: Effect, tier = 0) => { const p = power(e); return p <= 0 ? 0 : Math.min(CONFIG.cost.max, Math.max(1, Math.round(p / (CONFIG.cost.div * (1 + CONFIG.cost.tier * tier))))); };
/** Effetti scritti in forma compatta, una riga ciascuno (mostrati sulla carta). */
const synText = (s: { k: string; n?: number }) => (({ adrenaline: `⚡ +${s.n} danni alle carte offensive del turno`, bypass: '🎯 Gli scudi nemici vengono ignorati (turno)', freeNext: '🆓 La prossima carta costa 0', flow: `🌊 +${s.n} scudi per ogni combo giocata`, shieldAtk: '🛡️ Danni pari agli scudi attivi (si aggiorna finché non attacca)', momentum: `📈 ${s.n} danno per ogni carta giocata nel turno`, scout: '🔍 Vedi 3 carte del mazzo: ne scegli una (costa 1)', dup: '✖️ La prossima carta è schierata due volte', clone: '🧬 Copia in mano l\'ultima carta giocata' } as Record<string, string>)[s.k] ?? s.k);
/** Nelle righe delle carte la categoria è solo l'icona (la stessa del pallino sulla carta): così le righe restano corte. */
const CNAME = (c?: CatOrAny) => !c || c === 'any' ? '' : ' ' + CAT_INFO[c as Cat].icon;
const WHERE_TXT: Record<Where, string> = { played: 'giocata nel turno', hand: 'in mano', field: 'sul campo', discard: 'negli scarti' };
/** Righe di un effetto "per ogni carta": un'intestazione (traducibile) e una riga di valori fatta solo di numeri e icone. */
export const scaleLines = (s: Scale): string[] => [`🔢 Per ogni carta${CNAME(s.cat)} ${WHERE_TXT[s.where]}:`, '↳ ' + [s.dmg && `+${s.dmg}⚔️`, s.block && `+${s.block}🛡️`, s.draw && `+${s.draw}✦`, s.energy && `+${s.energy}⚡`, s.heal && `+${s.heal}✚`].filter(Boolean).join(' '), s.max && `↳ Massimo ${s.max} carte`].filter(Boolean) as string[];
export const trigLines = (t: Trigger): string[] => [t.on === 'hit' ? '🔔 Quando viene colpita:' : t.on === 'turnStart' ? '🔔 A inizio turno:' : `🔔 Quando giochi una carta${CNAME(t.cat)}:`, t.dmg && `↳ Infligge ${t.dmg} danni diretti`, t.block && `↳ +${t.block} guardia`, t.heal && `↳ Cura +${t.heal}`, t.draw && `↳ Pesca +${t.draw}`, t.energy && `↳ +${t.energy} energia`, t.boost && `↳ La carta giocata ha +${t.boost}`, t.max && `↳ Massimo ${t.max} ${t.max === 1 ? 'volta' : 'volte'} per turno`].filter(Boolean) as string[];
/** Passive degli equipaggiamenti: stesse righe dei trigger, con la formulazione per il personaggio ("vieni colpito"). */
export const passiveLines = (t: Trigger): string[] => { const l = trigLines(t); if (t.on === 'hit') l[0] = '🔔 Quando vieni colpito:'; return l; };
export const effectLines = (e: Effect): string[] => [e.dmg && `⚔️ Danni ${e.dmg}${e.hits ? '×' + e.hits : ''}`, e.link && `🔗 Dopo ${MOVES[e.link.from]?.name ?? e.link.from}: ${linkText(e.link)}`, e.block && `🛡️ Guardia ${e.block}`, e.block && !e.dmg && `⏳ ${e.dur === 0 ? 'Finché abbattuta' : ((e.dur ?? 1) > 1 ? `${e.dur} turni` : '1 turno')}`, e.heal && `✚ Cura ${e.heal}`, e.draw && `✦ Pesca ${e.draw}`, e.energy && `⚡ +${e.energy} energia`, e.syn && synText(e.syn), ...(e.scale ? scaleLines(e.scale) : []), ...(e.trigger ? trigLines(e.trigger) : []), e.flee && '🏃 Fuga: lasci il duello senza conseguenze', e.req && `⚠ Richiede: ${[e.req.hpBelow !== undefined && `PV < ${Math.round(e.req.hpBelow * 100)}%`, e.req.minTurn !== undefined && `dal turno ${e.req.minTurn}`].filter(Boolean).join(', ')}`].filter(Boolean) as string[];
export const describe = (e: Effect) => effectLines(e).join(' · ');
import { GAME as J } from './gamedata';
export const MOVES: Record<string, Move> = {};
export const EQUIPMENT: Record<string, Equipment> = {};
/** Costruzione di carte ed equipaggiamenti dal JSON. `cost` è facoltativo: se manca si calcola dalla forza della carta. */
/** `tier` = indice dell'isola dell'equipaggiamento: le carte delle isole avanzate costano meno a parità di potenza (CONFIG.cost.tier). */
const mv = (id: string, name: string, source: string, price: number, effect: Effect, cost?: number, tier = 0, cat?: string) => { MOVES[id] = { id, name, source, price, effect, desc: describe(effect), cost: cost ?? costOf(effect, tier), cat: (CATS as readonly string[]).includes(cat ?? '') ? cat as Cat : 'melee' }; };
for (const m of J.baseMoves) mv(m.id, m.name, 'base', 0, m.effect as Effect, undefined, 0, (m as { cat?: string }).cat);
for (const e of J.equipment) {
  e.moves.forEach(m => mv(m.id, m.name, e.id, 0, m.effect as Effect, (m as { cost?: number }).cost, J.regions.findIndex(g => g.id === e.island), (m as { cat?: string }).cat));
  e.advanced.forEach(m => mv(m.id, m.name, e.id, m.price, m.effect as Effect, (m as { cost?: number }).cost, J.regions.findIndex(g => g.id === e.island), (m as { cat?: string }).cat));
  EQUIPMENT[e.id] = { id: e.id, name: e.name, desc: e.desc, price: e.price, island: e.island, kind: (e as { kind?: string }).kind ?? 'gear', bonus: e.bonus as Equipment['bonus'], passives: ((e as { passives?: Trigger[] }).passives ?? []), moves: e.moves.map(m => m.id) as [string, string, string], advanced: e.advanced.map(m => m.id) };
}
export interface Style { id: string; name: string; icon: string; desc: string; deck: string[] }
/** Stili di combattimento iniziali: ognuno ha il proprio mazzo base di 10 carte. */
export const STYLES: Style[] = J.styles;
export interface EnemyMove { id: string; name: string; icon: string; dmg?: number; hits?: number; block?: number; heal?: number; dur?: number }
/** Carte nemiche: valori = moltiplicatori della potenza del nemico (CONFIG.enemy.cardMult). */
export const ENEMY_MOVES: EnemyMove[] = J.enemyMoves;
export const moveOf = (uid: string): string => {
  const [k, a, b] = uid.split(':');
  return k === 'base' || k === 'clone' ? a : k === 'eq' ? EQUIPMENT[a].moves[+b] : a;
};

/** Scelte di capitolo (schermata Storia), legate a un'isola (`region`) e a un incontro (`at`, 0–4): 3 opzioni con effetti leggeri e bilanciati. gold è in "unità" (vedi goldUnit nel motore); gli altri effetti valgono solo per il duello successivo. */
export interface ChoiceFx { gold?: number; block?: number; energy?: number; draw?: number; foeHp?: number; hp?: number }
export interface ChoiceOpt { id: string; label: string; text: string; fx: ChoiceFx }
export interface ChoiceEv { id: string; region: string; at: number; title: string; text: string; options: ChoiceOpt[] }
export const CHOICES: ChoiceEv[] = J.choices as ChoiceEv[];
