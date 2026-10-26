// Sorgente unica dei dati di gioco: data/game.json (oppure i dati personalizzati salvati dall'Editor), tradotti nella lingua scelta.
// I testi nella lingua base (italiano) stanno nei campi; le traduzioni in game.json → "i18n": { "en": { "move.jab.name": "Jab", … } }.
import BASE from '../data/game.json';
import { LANG } from './i18n';
export type GameData = Omit<typeof BASE, 'i18n'> & { baseLang?: string; i18n?: Record<string, Record<string, string>> };
export const CUSTOM_KEY = 'comboo.customdata.v1';
const store = (): Storage | null => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };
function loadCustom(): GameData | null { try { const raw = store()?.getItem(CUSTOM_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
/** Dati inclusi nel gioco (game.json) e dati personalizzati dall'Editor (se attivati). */
export const BUNDLED = BASE as unknown as GameData, CUSTOM = loadCustom();
/** Dati sorgente (lingua base + traduzioni), usati anche dall'Editor. */
export const RAW: GameData = CUSTOM ?? BUNDLED;
export const BASE_LANG = RAW.baseLang ?? 'it';
/* eslint-disable @typescript-eslint/no-explicit-any */
/** Enumera tutti i testi traducibili dei dati: chiave stabile → (oggetto, proprietà). Usata da traduzione a runtime ed Editor. */
export function forEachText(d: any, cb: (key: string, o: any, prop: string) => void) {
  const T = (pre: string, o: any, props: string[]) => props.forEach(p => { if (o && typeof o[p] === 'string') cb(`${pre}.${p}`, o, p); });
  for (const m of d.baseMoves ?? []) T(`move.${m.id}`, m, ['name']);
  for (const e of d.equipment ?? []) { T(`equipment.${e.id}`, e, ['name', 'desc']); for (const m of [...(e.moves ?? []), ...(e.advanced ?? [])]) T(`move.${m.id}`, m, ['name']); }
  for (const m of d.enemyMoves ?? []) T(`enemyMove.${m.id}`, m, ['name']);
  for (const s of d.styles ?? []) T(`style.${s.id}`, s, ['name', 'desc']);
  for (const r of d.regions ?? []) { T(`region.${r.id}`, r, ['name', 'level', 'concept', 'story', 'hero']); for (const e of r.enemies ?? []) T(`enemy.${e.id}`, e, ['name', 'lore', 'story']); }
  for (const c of d.choices ?? []) { T(`choice.${c.id}`, c, ['title', 'text']); for (const o of c.options ?? []) T(`choice.${c.id}.${o.id}`, o, ['label', 'text']); }
}
export function localize(raw: GameData, lang: string): GameData {
  const ov = raw.i18n?.[lang]; if (lang === (raw.baseLang ?? 'it') || !ov) return raw;
  const d = JSON.parse(JSON.stringify(raw)) as GameData; forEachText(d, (k, o, p) => { if (ov[k]) o[p] = ov[k]; }); return d;
}
/** Dati in uso dal gioco (nella lingua scelta). */
export const GAME: GameData = localize(RAW, LANG);
