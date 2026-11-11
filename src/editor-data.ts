// Logica pura dell'Editor (senza DOM): percorsi, rinomina id con aggiornamento dei riferimenti, controlli, elenco immagini attese.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type D = any;
export const SYN_KINDS = ['adrenaline', 'bypass', 'freeNext', 'flow', 'shieldAtk', 'momentum', 'scout', 'dup', 'clone'];
/** Categorie delle carte e relative etichette; "dove si contano" e "quando scatta" per gli effetti per categoria. */
export const CATS = ['melee', 'blade', 'firearm', 'magic'];
export const CAT_NAMES: Record<string, string> = { melee: '🥊 Corpo a corpo', blade: '🗡️ Lame', firearm: '🔫 Armi da fuoco', magic: '✨ Magia' };
export const WHERES: [string, string][] = [['played', 'giocate nel turno (fin qui)'], ['hand', 'in mano'], ['field', 'sul campo (schierate)'], ['discard', 'negli scarti']];
export const TRIG_ON: [string, string][] = [['hit', 'quando è colpita (carta) / vieni colpito (equipaggiamento)'], ['play', 'quando giochi una carta'], ['turnStart', 'a inizio turno']];
/** Controlli di un trigger (di una carta o di un equipaggiamento): restituisce messaggi di errore e avvisi. */
export function checkTrigger(t: D, who: string, equip: boolean): { err: string[]; warn: string[] } {
  const err: string[] = [], warn: string[] = [];
  if (!TRIG_ON.some(x => x[0] === t.on)) err.push(`${who}: momento del trigger sconosciuto "${t.on ?? ''}".`);
  if (t.on === 'play' && ![...CATS, 'any'].includes(t.cat ?? 'any')) err.push(`${who}: categoria del trigger sconosciuta "${t.cat}".`);
  if (!t.dmg && !t.block && !t.heal && !t.draw && !t.energy && !t.boost) warn.push(`${who}: il trigger non ha alcun effetto.`);
  if (t.boost && (!equip || t.on !== 'play')) warn.push(`${who}: il bonus alla carta giocata funziona solo nelle passive degli equipaggiamenti "quando giochi una carta".`);
  if (t.energy && t.on === 'hit') warn.push(`${who}: l'energia guadagnata quando si viene colpiti va persa (l'energia si azzera a inizio turno).`);
  return { err, warn };
}
export const EQ_KINDS = ['gear', 'implant', 'body', 'style', 'arcane'];
export const THEME_PRESETS = ['boxing', 'battle', 'desert', 'ocean', 'forest', 'ember'];
export const CHOICE_FX = ['gold', 'block', 'energy', 'draw', 'foeHp', 'hp'] as const;
/** Pesi di bilanciamento delle scelte di capitolo: ogni opzione dovrebbe valere ~1,5 punti e avere al massimo 2 effetti. */
export const CHOICE_W: Record<string, number> = { gold: 1, block: 1 / 6, energy: 1.5, draw: 1, foeHp: -0.15, hp: 0.2 };
export const CHOICE_RANGE = [1.1, 1.9] as const, CHOICE_MAX_FX = 2;
export const choicePts = (fx: Record<string, number> = {}) => Object.entries(fx).reduce((s, [k, v]) => s + (CHOICE_W[k] ?? 0) * (v || 0), 0);
/** Elementi usati dal tutorial: rinominarli o eliminarli lo rende inutilizzabile. */
export const TUTORIAL_IDS: Record<string, string[]> = { move: ['jab', 'guard', 'focus', 'wraps_a1'], equipment: ['wraps'], region: ['boxing'] };
export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const getP = (o: D, p: string): any => p.split('.').reduce((a, k) => a?.[k], o);
export function setP(o: D, p: string, v: any) { const ks = p.split('.'); let c = o; for (let i = 0; i < ks.length - 1; i++) { c[ks[i]] ??= /^\d+$/.test(ks[i + 1]) ? [] : {}; c = c[ks[i]]; } c[ks[ks.length - 1]] = v; }
export function delP(o: D, p: string) { const ks = p.split('.'), l = ks.pop()!, c = getP(o, ks.join('.')) ?? (ks.length ? null : o); if (c) { if (Array.isArray(c)) c.splice(+l, 1); else delete c[l]; } }

// ---- carte (mosse) ----
export interface MoveRef { m: D; owner: string | null; slot: 'base' | 'basic' | 'adv'; idx: number; path: string }
export function allMoves(d: D): MoveRef[] {
  const out: MoveRef[] = []; (d.baseMoves ?? []).forEach((m: D, i: number) => out.push({ m, owner: null, slot: 'base', idx: i, path: `baseMoves.${i}` }));
  (d.equipment ?? []).forEach((e: D, ei: number) => { (e.moves ?? []).forEach((m: D, i: number) => out.push({ m, owner: e.id, slot: 'basic', idx: i, path: `equipment.${ei}.moves.${i}` })); (e.advanced ?? []).forEach((m: D, i: number) => out.push({ m, owner: e.id, slot: 'adv', idx: i, path: `equipment.${ei}.advanced.${i}` })); });
  return out;
}
export const findMove = (d: D, id: string) => allMoves(d).find(r => r.m.id === id);
/** Sposta una carta (base ⇄ equipaggiamento, mosse base ⇄ avanzate). */
export function moveCard(d: D, id: string, owner: string | null, slot: 'base' | 'basic' | 'adv'): string | null {
  const r = findMove(d, id); if (!r) return 'Carta non trovata.'; const m = r.m;
  if (r.slot === 'base') d.baseMoves.splice(r.idx, 1); else { const e = d.equipment.find((x: D) => x.id === r.owner); e[r.slot === 'basic' ? 'moves' : 'advanced'].splice(r.idx, 1); }
  if (owner === null) { delete m.price; d.baseMoves.push(m); return null; }
  const e = d.equipment.find((x: D) => x.id === owner); if (!e) return 'Equipaggiamento non trovato.';
  if (slot === 'adv') { m.price ??= 20; (e.advanced ??= []).push(m); } else { delete m.price; (e.moves ??= []).push(m); } return null;
}
export function newMove(d: D, owner: string | null, slot: 'base' | 'basic' | 'adv'): string {
  let n = 1; const ids = new Set(allMoves(d).map(r => r.m.id)); while (ids.has('carta_' + n)) n++; const id = 'carta_' + n, m: D = { id, name: 'Nuova carta', cat: 'melee', effect: { dmg: 4 } };
  if (slot === 'adv') m.price = 20; if (owner === null) d.baseMoves.push(m); else { const e = d.equipment.find((x: D) => x.id === owner); (slot === 'adv' ? (e.advanced ??= []) : (e.moves ??= [])).push(m); } return id;
}
export function dupMove(d: D, id: string): string | null {
  const r = findMove(d, id); if (!r) return null; let n = 2; const ids = new Set(allMoves(d).map(x => x.m.id)); while (ids.has(`${id}_${n}`)) n++; const c = clone(r.m); c.id = `${id}_${n}`; c.name = `${r.m.name} (copia)`;
  if (r.owner === null) d.baseMoves.push(c); else { const e = d.equipment.find((x: D) => x.id === r.owner); e[r.slot === 'basic' ? 'moves' : 'advanced'].push(c); } return c.id;
}
export function deleteMove(d: D, id: string) {
  const r = findMove(d, id); if (!r) return; if (r.slot === 'base') d.baseMoves.splice(r.idx, 1); else { const e = d.equipment.find((x: D) => x.id === r.owner); e[r.slot === 'basic' ? 'moves' : 'advanced'].splice(r.idx, 1); }
  for (const s of d.styles ?? []) s.deck = (s.deck ?? []).filter((x: string) => x !== id); for (const x of allMoves(d)) if (x.m.effect?.link?.from === id) delete x.m.effect.link; dropI18n(d, `move.${id}.`);
}

// ---- rinomina id (aggiorna tutti i riferimenti e le traduzioni) ----
export type RenameKind = 'move' | 'equipment' | 'region' | 'enemy' | 'style' | 'enemyMove' | 'choice';
export interface Rename { kind: RenameKind; from: string; to: string }
const I18N_PREFIX: Record<RenameKind, string> = { move: 'move', equipment: 'equipment', region: 'region', enemy: 'enemy', style: 'style', enemyMove: 'enemyMove', choice: 'choice' };
function dropI18n(d: D, prefix: string) { for (const l of Object.values(d.i18n ?? {}) as D[]) for (const k of Object.keys(l)) if (k.startsWith(prefix)) delete l[k]; }
function moveI18n(d: D, kind: RenameKind, from: string, to: string) { const pf = `${I18N_PREFIX[kind]}.${from}.`, pt = `${I18N_PREFIX[kind]}.${to}.`; for (const l of Object.values(d.i18n ?? {}) as D[]) for (const k of Object.keys(l)) if (k.startsWith(pf)) { l[pt + k.slice(pf.length)] = l[k]; delete l[k]; } }
export const idOk = (s: string) => /^[A-Za-z0-9_-]+$/.test(s);
export function renameId(d: D, kind: RenameKind, from: string, to: string): string | null {
  to = to.trim(); if (to === from) return null; if (!idOk(to)) return 'L\'id può contenere solo lettere, numeri, "_" e "-" (è anche il nome del file immagine).';
  const taken = kind === 'move' ? !!findMove(d, to) : kind === 'equipment' ? d.equipment.some((x: D) => x.id === to) : kind === 'region' ? d.regions.some((x: D) => x.id === to) : kind === 'style' ? d.styles.some((x: D) => x.id === to) : kind === 'enemyMove' ? d.enemyMoves.some((x: D) => x.id === to) : kind === 'choice' ? d.choices.some((x: D) => x.id === to) : d.regions.some((r: D) => r.enemies.some((e: D) => e.id === to));
  if (taken) return 'Esiste già un elemento con questo id.';
  if (kind === 'move') { const r = findMove(d, from); if (!r) return 'Non trovato.'; r.m.id = to; for (const x of allMoves(d)) if (x.m.effect?.link?.from === from) x.m.effect.link.from = to; for (const s of d.styles) s.deck = s.deck.map((x: string) => x === from ? to : x); }
  else if (kind === 'equipment') { d.equipment.find((x: D) => x.id === from).id = to; }
  else if (kind === 'region') { const r = d.regions.find((x: D) => x.id === from); r.id = to; for (const e of d.equipment) if (e.island === from) e.island = to; for (const c of d.choices) if (c.region === from) c.region = to; for (const e of r.enemies) if (e.id?.startsWith(from + '-')) { const ni = to + e.id.slice(from.length); if (!d.regions.some((x: D) => x.enemies.some((y: D) => y.id === ni))) { moveI18n(d, 'enemy', e.id, ni); e.id = ni; } } }
  else if (kind === 'enemy') { for (const r of d.regions) for (const e of r.enemies) if (e.id === from) e.id = to; }
  else if (kind === 'style') d.styles.find((x: D) => x.id === from).id = to;
  else if (kind === 'enemyMove') { d.enemyMoves.find((x: D) => x.id === from).id = to; for (const r of d.regions) { r.enemyMoves = (r.enemyMoves ?? []).map((x: string) => x === from ? to : x); for (const e of r.enemies) if (e.moves) e.moves = e.moves.map((x: string) => x === from ? to : x); } }
  else d.choices.find((x: D) => x.id === from).id = to;
  moveI18n(d, kind, from, to); return null;
}
/** Registra una rinomina collassando le catene (a→b, b→c = a→c) e annullando i ritorni (a→b, b→a). */
export function addRename(list: Rename[], r: Rename): Rename[] {
  const i = list.findIndex(x => x.kind === r.kind && x.to === r.from); if (i < 0) return [...list, r];
  const first = list[i], rest = list.filter((_, j) => j !== i); return first.from === r.to ? rest : [...rest, { kind: r.kind, from: first.from, to: r.to }];
}
const IMG_PREFIX: Record<RenameKind, string[]> = { move: ['card-'], equipment: ['eq-', 'layer-'], region: ['foe-'], enemy: ['enemy-'], style: ['style-'], enemyMove: ['enemycard-'], choice: [] };
/** Script di shell che rinomina i file in assets/ secondo le rinominazioni fatte nell'Editor. */
export function renameScript(list: Rename[]): string {
  const L = ['#!/bin/sh', '# Rinomina le immagini in assets/ secondo gli id cambiati nell\'Editor (eseguilo dalla radice del progetto).', 'cd "$(dirname "$0")/assets" 2>/dev/null || cd assets || exit 1', 'mvimg() { for e in png jpg jpeg webp gif svg; do [ -f "$1.$e" ] && mv "$1.$e" "$2.$e" && echo "$1.$e -> $2.$e"; done; }'];
  for (const r of list) for (const p of IMG_PREFIX[r.kind]) L.push(`mvimg "${p}${r.from}" "${p}${r.to}"`); return L.join('\n') + '\n';
}

// ---- immagini attese ----
export interface ImgGroup { title: string; rows: { key: string; label: string }[] }
export function imageKeys(d: D): ImgGroup[] {
  const mv = (m: D, src: string) => ({ key: `card-${m.id}`, label: `${m.name} (${src})` });
  return [
    { title: 'Carte mossa', rows: [...(d.baseMoves ?? []).map((m: D) => mv(m, 'base')), ...(d.equipment ?? []).flatMap((e: D) => [...(e.moves ?? []), ...(e.advanced ?? [])].map((m: D) => mv(m, e.name)))] },
    { title: 'Equipaggiamenti (carta)', rows: (d.equipment ?? []).map((e: D) => ({ key: `eq-${e.id}`, label: e.name })) },
    { title: 'Equipaggiamenti sul personaggio (livello 400×800)', rows: (d.equipment ?? []).map((e: D) => ({ key: `layer-${e.id}`, label: e.name })) },
    { title: 'Stili iniziali', rows: (d.styles ?? []).map((s: D) => ({ key: `style-${s.id}`, label: s.name })) },
    { title: 'Isole / nemici di riserva', rows: (d.regions ?? []).map((r: D) => ({ key: `foe-${r.id}`, label: r.name })) },
    { title: 'Singoli nemici (capitoli)', rows: (d.regions ?? []).flatMap((r: D) => (r.enemies ?? []).map((e: D) => ({ key: `enemy-${e.id}`, label: `${e.name} (${r.name})` }))) },
    { title: 'Carte nemiche', rows: (d.enemyMoves ?? []).map((m: D) => ({ key: `enemycard-${m.id}`, label: m.name })) },
  ];
}
export const imageKeyList = (d: D) => imageKeys(d).flatMap(g => g.rows.map(r => r.key));

// ---- controlli ----
export interface Issue { level: 'err' | 'warn'; msg: string }
export function validate(d: D): Issue[] {
  const o: Issue[] = [], e = (msg: string) => o.push({ level: 'err', msg }), w = (msg: string) => o.push({ level: 'warn', msg });
  const dup = (ids: string[], what: string) => { const s = new Set<string>(); for (const i of ids) { if (s.has(i)) e(`Id duplicato (${what}): ${i}`); s.add(i); } };
  const moves = allMoves(d), mids = new Set(moves.map(r => r.m.id)), rids = new Set((d.regions ?? []).map((r: D) => r.id)), emids = new Set((d.enemyMoves ?? []).map((m: D) => m.id)), n = d.config?.matchesPerIsland ?? 5;
  dup(moves.map(r => r.m.id), 'carte'); dup((d.equipment ?? []).map((x: D) => x.id), 'equipaggiamenti'); dup((d.regions ?? []).map((x: D) => x.id), 'isole'); dup((d.regions ?? []).flatMap((r: D) => (r.enemies ?? []).map((x: D) => x.id)), 'nemici'); dup((d.styles ?? []).map((x: D) => x.id), 'stili'); dup((d.choices ?? []).map((x: D) => x.id), 'scelte'); dup((d.enemyMoves ?? []).map((x: D) => x.id), 'mosse nemiche');
  for (const [k, ids] of Object.entries(TUTORIAL_IDS)) for (const id of ids) { const ok = k === 'move' ? mids.has(id) : k === 'equipment' ? (d.equipment ?? []).some((x: D) => x.id === id) : rids.has(id); if (!ok) w(`Il tutorial usa "${id}" (${k}), che non esiste più: il tutorial non funzionerà.`); }
  for (const r of moves) { const m = r.m, fx = m.effect ?? {}; if (!m.name) e(`Carta ${m.id}: manca il nome.`); if (fx.link && !mids.has(fx.link.from)) e(`Carta ${m.id}: il collegamento punta a "${fx.link.from}", che non esiste.`); if (!fx.dmg && !fx.block && !fx.heal && !fx.draw && !fx.energy && !fx.syn && !fx.flee && !fx.scale && !fx.trigger) w(`Carta ${m.id}: non ha alcun effetto.`);
    if (!CATS.includes(m.cat)) e(`Carta ${m.id}: categoria mancante o sconosciuta ("${m.cat ?? ''}"): scegli Corpo a corpo, Lame, Armi da fuoco o Magia.`);
    if (fx.scale) { const sc = fx.scale; if (![...CATS, 'any'].includes(sc.cat)) e(`Carta ${m.id}: categoria dell'effetto "per ogni carta" sconosciuta ("${sc.cat ?? ''}").`); if (!WHERES.some(x => x[0] === sc.where)) e(`Carta ${m.id}: "dove si contano" sconosciuto ("${sc.where ?? ''}").`); if (!sc.dmg && !sc.block && !sc.draw && !sc.energy && !sc.heal) w(`Carta ${m.id}: l'effetto "per ogni carta" non dà alcun valore.`); }
    if (fx.trigger) { const t = checkTrigger(fx.trigger, `Carta ${m.id}`, false); t.err.forEach(e); t.warn.forEach(w); if (fx.dmg || fx.scale?.dmg) w(`Carta ${m.id}: una carta offensiva lascia il campo a fine turno, il trigger servirebbe a poco: usa una carta difensiva permanente (guardia, durata 0).`); else if (!fx.block) w(`Carta ${m.id}: il trigger funziona solo finché la carta è sul campo: serve una guardia (altrimenti scompare subito).`); } if (fx.syn && !SYN_KINDS.includes(fx.syn.k)) e(`Carta ${m.id}: sinergia sconosciuta "${fx.syn.k}".`); }
  for (const q of d.equipment ?? []) { (q.passives ?? []).forEach((t: D, i: number) => { const c = checkTrigger(t, `Equipaggiamento ${q.id} (passiva ${i + 1})`, true); c.err.forEach(e); c.warn.forEach(w); }); if ((q.moves ?? []).length !== 3) w(`Equipaggiamento ${q.id}: dovrebbe sbloccare esattamente 3 mosse (ne ha ${(q.moves ?? []).length}).`); if (!rids.has(q.island)) e(`Equipaggiamento ${q.id}: isola "${q.island}" inesistente.`); }
  for (const s of d.styles ?? []) { const dk = s.deck ?? []; if (dk.length < (d.config?.minDeck ?? 10)) w(`Stile ${s.id}: il mazzo ha ${dk.length} carte (minimo ${d.config?.minDeck ?? 10}).`); for (const c of dk) if (!d.baseMoves.some((m: D) => m.id === c)) e(`Stile ${s.id}: la carta "${c}" non è una mossa base.`); }
  if (!(d.regions ?? []).length) e('Serve almeno un\'isola.');
  for (const r of d.regions ?? []) { if ((r.enemies ?? []).length !== n) w(`Isola ${r.id}: ${(r.enemies ?? []).length} capitoli, il gioco ne prevede ${n} (config.matchesPerIsland).`); for (const m of r.enemyMoves ?? []) if (!emids.has(m)) e(`Isola ${r.id}: mossa nemica "${m}" inesistente.`); if (!(r.enemyMoves ?? []).length) w(`Isola ${r.id}: nessuna mossa nemica.`); if (!(d.equipment ?? []).some((x: D) => x.island === r.id)) w(`Isola ${r.id}: nessun equipaggiamento disponibile nello store.`); }
  for (const c of d.choices ?? []) { if (!rids.has(c.region)) e(`Scelta ${c.id}: isola "${c.region}" inesistente.`); if ((c.options ?? []).length < 3 || (c.options ?? []).length > 4) w(`Scelta ${c.id}: dovrebbe avere 3 opzioni (4 se ci sono scelte bloccate).`); if (!(c.options ?? []).some((x: D) => !x.req || !Object.keys(x.req).length)) e(`Scelta ${c.id}: serve almeno un'opzione sempre disponibile (senza requisiti).`); (c.options ?? []).forEach((x: D) => { if (x.req && Object.values(x.req.min ?? {}).concat(Object.values(x.req.max ?? {})).some(v => v != null) && !x.lock) w(`Scelta ${c.id}/${x.id}: un'opzione con requisiti statistici dovrebbe avere la frase di blocco.`); const p = choicePts(x.fx); if (p < CHOICE_RANGE[0] || p > CHOICE_RANGE[1]) w(`Scelta ${c.id}/${x.id}: valore ${p.toFixed(2)} fuori dall'intervallo bilanciato ${CHOICE_RANGE[0]}–${CHOICE_RANGE[1]}.`); if (Object.values(x.fx ?? {}).filter(Boolean).length > CHOICE_MAX_FX) w(`Scelta ${c.id}/${x.id}: più di ${CHOICE_MAX_FX} effetti.`); }); }
  { const setFlags = new Set<string>(); for (const c of d.choices ?? []) for (const x of c.options ?? []) for (const f of String(x.flag ?? '').split(',')) if (f.trim()) setFlags.add(f.trim());
    const chk = (cond: D | undefined, where: string) => { for (const f of [...String(cond?.flag ?? '').split(','), ...String(cond?.noFlag ?? '').split(',')]) if (f.trim() && !setFlags.has(f.trim())) w(`${where}: il flag "${f.trim()}" non viene impostato da nessuna scelta.`); };
    for (const c of d.choices ?? []) { chk(c.needs, `Scelta ${c.id}`); (c.extra ?? []).forEach((x: D, j: number) => chk(x.if, `Scelta ${c.id} (richiamo ${j + 1})`)); for (const x of c.options ?? []) chk(x.req, `Scelta ${c.id}/${x.id}`); }
    for (const x of d.epilogues ?? []) { chk(x.needs, `Epilogo ${x.id}`); (x.extra ?? []).forEach((y: D) => chk(y.if, `Epilogo ${x.id}`)); } }
  const seen = new Map<string, string>(); for (const r of d.regions ?? []) for (const en of r.enemies ?? []) { for (const m of en.moves ?? []) if (!emids.has(m)) e(`Nemico ${en.id}: mossa nemica "${m}" inesistente.`); if (en.moves?.length) { const key = [...new Set(en.moves as string[])].sort().join(','); if (seen.has(key)) w(`Nemici ${seen.get(key)} e ${en.id}: stesso moveset (dovrebbe essere riconoscibile e diverso per ogni nemico).`); else seen.set(key, en.id); } else w(`Nemico ${en.id}: nessun moveset proprio (usa quello dell'isola).`); }
  for (const r of d.regions ?? []) for (let a = 0; a < n; a++) if (!(d.choices ?? []).some((c: D) => c.region === r.id && c.at === a)) w(`Isola ${r.id}, capitolo ${a + 1}: nessuna scelta di storia.`);
  return o;
}
