// Traduzione dell'interfaccia. Il testo sorgente del gioco è in italiano e funge da chiave (stile gettext):
// ogni lingua è un file data/locales/<codice>.json {"Testo italiano": "Translation"} con segnaposto {0}, {1}… al posto dei numeri/valori.
// Come aggiungere una lingua: 1) crea data/locales/xx.json (usa `npm run i18n:extract` per generare il modello), 2) aggiungi una riga in LOCALES (src/locales.ts).
import { LOCALES } from './locales';
export const BASE_UI_LANG = 'it';
export const LANG_KEY = 'comboo.lang';
export interface LangInfo { code: string; name: string }
/** Lingue disponibili: la base (italiano) più quelle registrate in locales.ts. */
export const LANGS: LangInfo[] = [{ code: BASE_UI_LANG, name: 'Italiano' }, ...Object.entries(LOCALES).map(([code, l]) => ({ code, name: l.name }))];
const store = (): Storage | null => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };
function detect(): string {
  const saved = store()?.getItem(LANG_KEY); if (saved && LANGS.some(l => l.code === saved)) return saved;
  const nav = typeof navigator !== 'undefined' ? (navigator.language ?? '').slice(0, 2).toLowerCase() : ''; return LANGS.some(l => l.code === nav) ? nav : BASE_UI_LANG;
}
export const LANG = detect();
export function setLang(code: string) { try { store()?.setItem(LANG_KEY, code); } catch { /* ignora */ } if (typeof location !== 'undefined') location.reload(); }

// ---- dizionario (con modelli a segnaposto) ----
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Costruisce un traduttore da un dizionario {"testo italiano": "translation"}; i segnaposto {0}, {1}… catturano numeri, nomi o frammenti. */
export function buildTr(ui0: Record<string, string>): (s: string) => string {
  let ui = ui0; const dict = new Map<string, string>(), patterns: { re: RegExp; to: string; nums: number[] }[] = [], cache = new Map<string, string>();
  // chiavi fatte di elementi inline affiancati (<b>…</b><small>…</small>): si traducono anche i singoli elementi, per i nodi DOM che li contengono da soli
  const WR = /<(b|small|i|span|em|strong)\b[^>]*>([^<]*)<\/\1>/g, pairs: [string, string][] = [];
  for (const [k, v] of Object.entries(ui)) { if (!v || !k.includes('<')) continue; const a = [...k.matchAll(WR)], b = [...v.matchAll(WR)]; if (a.length && a.length === b.length) a.forEach((m, i) => { if (m[2].trim() && /[A-Za-zÀ-ÿ]{2}/.test(m[2])) pairs.push([m[2].trim(), b[i][2].trim()]); }); }
  for (const [k, v] of pairs) if (!(k in ui)) ui = { ...ui, [k]: v };
  for (const [k, v] of Object.entries(ui)) { if (!v) continue; if (!/\{\d+\}/.test(k)) { dict.set(k, v); continue; } patterns.push({ re: new RegExp('^' + k.split(/\{\d+\}/).map(esc).join('(.*?)') + '$', 's'), to: v, nums: [...k.matchAll(/\{(\d+)\}/g)].map(x => +x[1]) }); }
  patterns.sort((a, b) => b.re.source.length - a.re.source.length);
  const f = (s: string): string => {
    if (!s) return s; const c = cache.get(s); if (c !== undefined) return c; const lead = s.match(/^\s*/)![0], trail = s.match(/\s*$/)![0], core = s.trim().replace(/\s+/g, ' '); let out = s;
    if (core) { const d = dict.get(core); if (d !== undefined) out = lead + d + trail; else for (const p of patterns) { const m = core.match(p.re); if (m) { out = lead + p.to.replace(/\{(\d+)\}/g, (_, i) => f(m[p.nums.indexOf(+i) + 1] ?? '')) + trail; break; } } }
    if (cache.size > 6000) cache.clear(); cache.set(s, out); return out;
  };
  return f;
}
/** Traduce un testo sorgente italiano (anche con valori variabili: i numeri/nomi nel testo vengono riportati nella traduzione). */
export const tr: (s: string) => string = LANG === BASE_UI_LANG ? (s => s) : buildTr(LOCALES[LANG]?.ui ?? {});
/** Come tr(), con parametri espliciti: t('Hai {0} monete', n). */
export const t = (s: string, ...a: (string | number)[]) => tr(s.replace(/\{(\d+)\}/g, (_, i) => String(a[+i] ?? ''))) ;

// ---- traduzione automatica del DOM (testi, blocchi con tag inline e attributi), così il codice di interfaccia resta in italiano ----
const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'], orig = new WeakMap<Node, string>(), INLINE = new Set(['B', 'I', 'EM', 'STRONG', 'SMALL', 'SPAN', 'BR', 'U', 'A', 'CODE', 'SUB', 'SUP', 'IMG', 'KBD', 'MARK']);
function doText(n: Text) { if (orig.get(n) === n.data) return; const out = tr(n.data); if (out !== n.data) { n.data = out; orig.set(n, out); } }
function doEl(e: Element) { for (const a of ATTRS) { const v = e.getAttribute(a); if (v) { const o = tr(v); if (o !== v) e.setAttribute(a, o); } } }
const inlineOnly = (e: Element): boolean => Array.from(e.children).every(c => INLINE.has(c.tagName) && inlineOnly(c));
function walk(n: Node) {
  if (n.nodeType === 3) { doText(n as Text); return; } if (n.nodeType !== 1) return; const e = n as Element; if (e.matches('script,style,[data-notr]')) return; doEl(e);
  if (e.children.length && inlineOnly(e) && /\S/.test(e.textContent ?? '')) { const html = e.innerHTML, out = tr(html); if (out !== html) { e.innerHTML = out; return; } }
  n.childNodes.forEach(walk);
}
export function localizeDom(root: Node) { if (LANG !== BASE_UI_LANG) walk(root); }
let started = false;
/** Avvia l'osservatore: ogni modifica al DOM viene tradotta (inclusi tooltip, toast e finestre). */
export function startLocalizer() {
  if (started || LANG === BASE_UI_LANG || typeof document === 'undefined') return; started = true; document.documentElement.lang = LANG; localizeDom(document.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') doText(m.target as Text); else if (m.type === 'attributes') doEl(m.target as Element); else m.addedNodes.forEach(n => walk(n)); } }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
