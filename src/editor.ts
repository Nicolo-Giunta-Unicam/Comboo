// Editor dei dati di gioco: carte, equipaggiamenti, stili, isole/capitoli (con palette colori), scelte di storia, mosse nemiche, immagini attese ed esportazione JSON.
// Lavora su una copia dei dati (bozza salvata nel browser): "Esporta JSON" scarica game.json da mettere in data/; "Prova nel gioco" usa la bozza senza toccare il repository.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BASE_LANG, CUSTOM, CUSTOM_KEY, RAW, forEachText } from './gamedata';
import { LANG, LANGS } from './i18n';
import { ASSETS } from './assets.generated';
import { costOf, effectLines } from './data';
import { paletteVars } from './theme';
import { CHOICE_FX, EQ_KINDS, SYN_KINDS, THEME_PRESETS, TUTORIAL_IDS, addRename, allMoves, choicePts, clone, delP, deleteMove, dupMove, findMove, getP, imageKeys, imageKeyList, moveCard, newMove, renameId, renameScript, setP, validate, type D, type Rename, type RenameKind } from './editor-data';

const DRAFT_KEY = 'comboo.editor.draft.v1';
type Tab = 'cards' | 'equip' | 'styles' | 'islands' | 'choices' | 'enemy' | 'images' | 'general';
const TABS: [Tab, string][] = [['cards', '🃏 Carte'], ['equip', '🔧 Equipaggiamenti'], ['styles', '🥋 Stili'], ['islands', '🏝 Isole e capitoli'], ['choices', '✦ Scelte'], ['enemy', '👹 Mosse nemiche'], ['images', '🖼 Immagini'], ['general', '⚙ Generale']];
interface St { data: D; tab: Tab; sel: Partial<Record<Tab, string>>; lang: string; q: string; filter: string; renames: Rename[]; msg: string }
let S: St, host: HTMLElement, onExit: () => void, wired: HTMLElement | null = null;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const store = (): Storage | null => { try { return localStorage; } catch { return null; } };
const save = () => { try { store()?.setItem(DRAFT_KEY, JSON.stringify({ data: S.data, tab: S.tab, sel: S.sel, lang: S.lang, renames: S.renames })); } catch { /* quota */ } };
const langs = () => Array.from(new Set([BASE_LANG, ...LANGS.map(l => l.code), ...Object.keys(S.data.i18n ?? {})]));
const langs0 = () => Array.from(new Set([BASE_LANG, ...LANGS.map(l => l.code)]));
const langName = (c: string) => LANGS.find(l => l.code === c)?.name ?? c;
const translated = (lang: string) => { let n = 0, tot = 0; forEachText(S.data, (k, o, p) => { tot++; if (S.data.i18n?.[lang]?.[k] ?? (lang === BASE_LANG ? o[p] : '')) n++; }); return [n, tot]; };

// ---- campi ----
type Kind = 's' | 'n' | 'o' | 'b' | 'c' | 'sel';
interface Opt { tk?: string; ml?: boolean; opts?: [string, string][]; step?: number; ph?: string; cls?: string; min?: number; max?: number }
function field(label: string, p: string, kind: Kind = 's', o: Opt = {}): string {
  const tr = o.tk && S.lang !== BASE_LANG; let v: any = tr ? S.data.i18n?.[S.lang]?.[o.tk!] ?? '' : getP(S.data, p); const base = o.tk ? getP(S.data, p) : '';
  const a = `data-p="${p}" data-k="${kind}" ${o.tk ? `data-tk="${o.tk}"` : ''}`; let c: string;
  if (kind === 'b') c = `<input type="checkbox" ${a} ${v ? 'checked' : ''}>`;
  else if (kind === 'sel') c = `<select ${a}>${(o.opts ?? []).map(([val, l]) => `<option value="${esc(val)}" ${String(v ?? '') === val ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (kind === 'c') c = `<input type="color" ${a} value="${esc(v || '#888888')}">`;
  else if (o.ml) c = `<textarea ${a} rows="3" placeholder="${esc(tr ? base : o.ph)}">${esc(v)}</textarea>`;
  else c = `<input ${kind === 'n' || kind === 'o' ? `type="number" step="${o.step ?? 'any'}" ${o.min !== undefined ? `min="${o.min}"` : ''} ${o.max !== undefined ? `max="${o.max}"` : ''}` : 'type="text"'} ${a} value="${esc(v)}" placeholder="${esc(tr ? base : o.ph)}">`;
  return `<label class="edf ${o.cls ?? ''}"><span>${label}${tr ? ` <em>${esc(langName(S.lang))}</em>` : ''}</span>${c}</label>`;
}
const idField = (label: string, kind: RenameKind, id: string) => `<label class="edf"><span>${label}</span><input type="text" data-rn="${kind}:${esc(id)}" value="${esc(id)}"></label>`;
const btn = (label: string, e: string, o: { id?: string; i?: number | string; cls?: string; slot?: string; title?: string } = {}) => `<button class="edb ${o.cls ?? ''}" data-e="${e}" ${o.id !== undefined ? `data-id="${esc(o.id)}"` : ''} ${o.i !== undefined ? `data-i="${o.i}"` : ''} ${o.slot ? `data-slot="${o.slot}"` : ''} ${o.title ? `title="${esc(o.title)}"` : ''}>${label}</button>`;
const tl = (key: string, o: any, prop: string) => (S.lang !== BASE_LANG ? S.data.i18n?.[S.lang]?.[`${key}.${prop}`] : '') || o[prop] || '';

// ---- carte ----
const thumb = (key: string) => ASSETS[key] ? `<img class="edth" src="${ASSETS[key]}" alt="">` : '<span class="edth ph">🃏</span>';
function ownerLabel(owner: string | null, slot: string) { if (owner === null) return 'Base'; const e = S.data.equipment.find((x: D) => x.id === owner), n = tl(`equipment.${owner}`, e ?? {}, 'name') || owner; return slot === 'adv' ? `${n} · avanzata` : `${n} · sbloccata`; }
function cardsView(): [string, string] {
  const sel = S.sel.cards, refs = allMoves(S.data), q = S.q.toLowerCase(), f = S.filter;
  const list = refs.filter(r => (!f || (f === 'base' ? r.owner === null : r.owner === f)) && (!q || r.m.id.toLowerCase().includes(q) || tl(`move.${r.m.id}`, r.m, 'name').toLowerCase().includes(q)));
  const opts = [['', 'Tutte'], ['base', 'Base'], ...S.data.equipment.map((e: D) => [e.id, tl(`equipment.${e.id}`, e, 'name') || e.id])] as [string, string][];
  const l = `<div class="edtools"><input data-q type="search" placeholder="Cerca…" value="${esc(S.q)}"><select data-flt>${opts.map(([v, n]) => `<option value="${esc(v)}" ${f === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>` + btn('+ Nuova carta', 'newmove', { cls: 'pri', id: f === 'base' || !f ? '' : f }) +
    list.map(r => `<div class="edi ${sel === r.m.id ? 'on' : ''}" data-e="sel" data-id="${esc(r.m.id)}">${thumb('card-' + r.m.id)}<div><b>${esc(tl(`move.${r.m.id}`, r.m, 'name'))}</b><small>${esc(r.m.id)} · ⚡${r.m.cost ?? costOf(r.m.effect ?? {})} · ${esc(ownerLabel(r.owner, r.slot))}</small></div></div>`).join('');
  const r = refs.find(x => x.m.id === sel); if (!r) return [l, '<p class="edhint">Seleziona una carta a sinistra, oppure creane una nuova.</p>'];
  const m = r.m, p = r.path, fx = (k: string) => `${p}.effect.${k}`, e = m.effect ?? {}, own = r.owner === null ? 'base' : `${r.owner}:${r.slot === 'adv' ? 'adv' : 'basic'}`;
  const ownerOpts = [['base', 'Mosse base (di tutti)'], ...S.data.equipment.flatMap((q: D) => [[`${q.id}:basic`, `${tl(`equipment.${q.id}`, q, 'name') || q.id} · sbloccata`], [`${q.id}:adv`, `${tl(`equipment.${q.id}`, q, 'name') || q.id} · avanzata (store)`]])] as [string, string][];
  const moveOpts = refs.filter(x => x.m.id !== m.id).map(x => [x.m.id, `${tl(`move.${x.m.id}`, x.m, 'name')} (${x.m.id})`]) as [string, string][];
  const lines = effectLines(e), key = 'card-' + m.id;
  const form = `<div class="edcols"><div>${idField('Id (anche nome file immagine)', 'move', m.id)}${field('Nome', `${p}.name`, 's', { tk: `move.${m.id}.name` })}
    <label class="edf"><span>Appartiene a</span><select data-own="${esc(m.id)}">${ownerOpts.map(([v, n]) => `<option value="${esc(v)}" ${own === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    ${field('Costo energia (vuoto = automatico)', `${p}.cost`, 'o', { min: 0, ph: `auto: ${costOf(e)}` })}${r.slot === 'adv' ? field('Prezzo nello store', `${p}.price`, 'n', { min: 0 }) : ''}</div>
    <div class="edprev"><div class="edcard">${thumb(key)}<b>${esc(tl(`move.${m.id}`, m, 'name'))}</b><span class="edcost">⚡ ${m.cost ?? costOf(e)}</span>${lines.map(x => `<small>${esc(x)}</small>`).join('')}</div><small class="edfile">${esc('assets/' + key + '.png')} ${ASSETS[key] ? '✓' : '— mancante'}</small></div></div>
    <h4>Effetto</h4><div class="edgrid">${field('Danni', fx('dmg'), 'o', { min: 0 })}${field('Colpi', fx('hits'), 'o', { min: 1 })}${field('Guardia (scudo)', fx('block'), 'o', { min: 0 })}${field('Durata scudo (turni, 0 = istantaneo)', fx('dur'), 'o', { min: 0 })}${field('Cura', fx('heal'), 'o', { min: 0 })}${field('Pesca carte', fx('draw'), 'o', { min: 0 })}${field('Energia', fx('energy'), 'o')}${field('Fuga (scappa dal duello)', fx('flee'), 'b')}</div>
    <h4>Collegamento <small>(bonus se la carta precedente è…)</small></h4>${e.link ? `<div class="edgrid">${field('Dopo la carta', fx('link.from'), 'sel', { opts: moveOpts })}${field('+Danni', fx('link.dmg'), 'o')}${field('+Guardia', fx('link.block'), 'o')}${field('+Pesca', fx('link.draw'), 'o')}${field('+Energia', fx('link.energy'), 'o')}</div>${btn('− Rimuovi collegamento', 'dellink', { id: p })}` : btn('+ Aggiungi collegamento', 'addlink', { id: p })}
    <h4>Sinergia</h4>${e.syn ? `<div class="edgrid">${field('Tipo', fx('syn.k'), 'sel', { opts: SYN_KINDS.map(k => [k, k]) })}${field('Valore (n)', fx('syn.n'), 'o')}</div>${btn('− Rimuovi sinergia', 'delsyn', { id: p })}` : btn('+ Aggiungi sinergia', 'addsyn', { id: p })}
    <h4>Requisiti</h4>${e.req ? `<div class="edgrid">${field('Solo se PV sotto (frazione, es. 0.5)', fx('req.hpBelow'), 'o', { step: 0.05 })}${field('Dal turno', fx('req.minTurn'), 'o')}</div>${btn('− Rimuovi requisiti', 'delreq', { id: p })}` : btn('+ Aggiungi requisiti', 'addreq', { id: p })}
    <div class="edact">${btn('⎘ Duplica', 'dupmove', { id: m.id })}${btn('🗑 Elimina', 'delmove', { id: m.id, cls: 'danger' })}</div>`;
  return [l, form];
}

// ---- equipaggiamenti ----
function equipView(): [string, string] {
  const sel = S.sel.equip, list = S.data.equipment as D[], eq = list.find(e => e.id === sel), reg = S.data.regions as D[];
  const l = btn('+ Nuovo equipaggiamento', 'neweq', { cls: 'pri' }) + list.map(e => `<div class="edi ${sel === e.id ? 'on' : ''}" data-e="sel" data-id="${esc(e.id)}">${thumb('eq-' + e.id)}<div><b>${esc(tl(`equipment.${e.id}`, e, 'name'))}</b><small>${esc(e.id)} · 💰${e.price} · ${esc(e.island)}</small></div></div>`).join('');
  if (!eq) return [l, '<p class="edhint">Seleziona un equipaggiamento.</p>']; const i = list.indexOf(eq), p = `equipment.${i}`, mv = (m: D, slot: string) => `<div class="edrow">${thumb('card-' + m.id)}<span><b>${esc(tl(`move.${m.id}`, m, 'name'))}</b> <small>${esc(m.id)}${slot === 'adv' ? ` · 💰${m.price ?? ''}` : ''}</small></span>${btn('Modifica', 'gotomove', { id: m.id })}</div>`;
  return [l, `<div class="edcols"><div>${idField('Id (anche nome file immagine)', 'equipment', eq.id)}${field('Nome', `${p}.name`, 's', { tk: `equipment.${eq.id}.name` })}${field('Descrizione', `${p}.desc`, 's', { tk: `equipment.${eq.id}.desc`, ml: true })}</div>
    <div>${field('Prezzo', `${p}.price`, 'n', { min: 0 })}${field('Isola dello store', `${p}.island`, 'sel', { opts: reg.map(r => [r.id, tl(`region.${r.id}`, r, 'name') || r.id]) })}${field('Tipo', `${p}.kind`, 'sel', { opts: EQ_KINDS.map(k => [k, k]) })}${field('Bonus danni', `${p}.bonus.dmg`, 'o')}${field('Bonus PV massimi', `${p}.bonus.maxHp`, 'o')}</div></div>
    <h4>Mosse sbloccate (3) <small>${(eq.moves ?? []).length}/3</small></h4>${(eq.moves ?? []).map((m: D) => mv(m, 'basic')).join('')}${btn('+ Nuova mossa sbloccata', 'newmoveIn', { id: eq.id, slot: 'basic' })}
    <h4>Mosse avanzate (nello store)</h4>${(eq.advanced ?? []).map((m: D) => mv(m, 'adv')).join('')}${btn('+ Nuova mossa avanzata', 'newmoveIn', { id: eq.id, slot: 'adv' })}
    <p class="edfile">${esc('assets/eq-' + eq.id + '.png')} ${ASSETS['eq-' + eq.id] ? '✓' : '— mancante'} · ${esc('assets/layer-' + eq.id + '.png')} ${ASSETS['layer-' + eq.id] ? '✓' : '— mancante'} (livello sul personaggio)</p>
    <div class="edact">${btn('⎘ Duplica', 'dupeq', { id: eq.id })}${btn('🗑 Elimina', 'deleq', { id: eq.id, cls: 'danger' })}</div>`];
}

// ---- stili ----
function stylesView(): [string, string] {
  const sel = S.sel.styles, list = S.data.styles as D[], st = list.find(s => s.id === sel);
  const l = btn('+ Nuovo stile', 'newstyle', { cls: 'pri' }) + list.map(s => `<div class="edi ${sel === s.id ? 'on' : ''}" data-e="sel" data-id="${esc(s.id)}"><span class="edth ph">${esc(s.icon)}</span><div><b>${esc(tl(`style.${s.id}`, s, 'name'))}</b><small>${esc(s.id)} · ${s.deck.length} carte</small></div></div>`).join('');
  if (!st) return [l, '<p class="edhint">Seleziona uno stile.</p>']; const i = list.indexOf(st), p = `styles.${i}`, base = S.data.baseMoves as D[];
  return [l, `<div class="edcols"><div>${idField('Id', 'style', st.id)}${field('Nome', `${p}.name`, 's', { tk: `style.${st.id}.name` })}${field('Icona (emoji)', `${p}.icon`)}${field('Descrizione', `${p}.desc`, 's', { tk: `style.${st.id}.desc`, ml: true })}</div></div>
    <h4>Mazzo iniziale <small>${st.deck.length} carte (min ${S.data.config?.minDeck}, max ${S.data.config?.maxDeck})</small></h4><div class="edchips">${st.deck.map((c: string, k: number) => `<span class="edchip">${esc(tl(`move.${c}`, base.find(m => m.id === c) ?? {}, 'name') || c)} <button data-e="deckdel" data-i="${k}" title="Rimuovi">×</button></span>`).join('')}</div>
    <label class="edf"><span>Aggiungi carta al mazzo</span><select data-deckadd><option value="">— scegli —</option>${base.map(m => `<option value="${esc(m.id)}">${esc(tl(`move.${m.id}`, m, 'name'))} (${esc(m.id)})</option>`).join('')}</select></label>
    <div class="edact">${btn('🗑 Elimina stile', 'delstyle', { id: st.id, cls: 'danger' })}</div>`];
}

// ---- isole e capitoli ----
function islandsView(): [string, string] {
  const sel = S.sel.islands, list = S.data.regions as D[], r = list.find(x => x.id === sel);
  const l = btn('+ Nuova isola', 'newreg', { cls: 'pri' }) + list.map((x, i) => `<div class="edi ${sel === x.id ? 'on' : ''}" data-e="sel" data-id="${esc(x.id)}"><span class="edth sw" style="background:${esc(x.palette?.bg ?? x.color)}"></span><div><b>${i + 1}. ${esc(tl(`region.${x.id}`, x, 'name'))}</b><small>${esc(x.id)} · ${(x.enemies ?? []).length} capitoli</small></div></div>`).join('');
  if (!r) return [l, '<p class="edhint">Seleziona un\'isola.</p>']; const i = list.indexOf(r), p = `regions.${i}`, pal = r.palette, pv = pal ? paletteVars(pal) : null;
  const sw = pv ? `<div class="edpal" style="background:linear-gradient(135deg,${pv['--bg1']},${pv['--bg0']});border-color:${pv['--bd']}"><span style="background:${pv['--pn1']}">pannello</span><span style="background:${pv['--btn1']};color:${pv['--ac1']}">pulsante</span><b style="color:${pv['--gold']}">evidenza</b></div>` : '';
  const enemies = (r.enemies ?? []).map((e: D, k: number) => `<div class="edchap"><h5>Capitolo ${k + 1}${k === r.enemies.length - 1 ? ' · boss' : ''} <small>${esc(e.id ?? '')}</small></h5><div class="edgrid">${idField('Id (nome file immagine)', 'enemy', e.id)}${field('Nome nemico', `${p}.enemies.${k}.name`, 's', { tk: `enemy.${e.id}.name` })}${field('Moltiplicatore PV', `${p}.enemies.${k}.hpMul`, 'o', { step: 0.05 })}${field('Moltiplicatore attacco', `${p}.enemies.${k}.atkMul`, 'o', { step: 0.05 })}</div>${field('Descrizione breve (lore)', `${p}.enemies.${k}.lore`, 's', { tk: `enemy.${e.id}.lore` })}${field('Storia del capitolo ({nome} = protagonista)', `${p}.enemies.${k}.story`, 's', { tk: `enemy.${e.id}.story`, ml: true })}<div class="edact">${btn('↑', 'upenemy', { id: r.id, i: k })}${btn('↓', 'downenemy', { id: r.id, i: k })}${btn('🗑 Elimina capitolo', 'delenemy', { id: r.id, i: k, cls: 'danger' })}</div><small class="edfile">assets/enemy-${esc(e.id)}.png ${ASSETS['enemy-' + e.id] ? '✓' : '— mancante'}</small></div>`).join('');
  return [l, `<div class="edcols"><div>${idField('Id (anche nome file immagine foe-…)', 'region', r.id)}${field('Nome isola', `${p}.name`, 's', { tk: `region.${r.id}.name` })}${field('Livello (es. Umano, Divino)', `${p}.level`, 's', { tk: `region.${r.id}.level` })}${field('Concetto', `${p}.concept`, 's', { tk: `region.${r.id}.concept` })}${field('Storia dell\'isola', `${p}.story`, 's', { tk: `region.${r.id}.story`, ml: true })}${field('Testo del protagonista', `${p}.hero`, 's', { tk: `region.${r.id}.hero`, ml: true })}</div>
    <div><h4>Colori dello scenario</h4>${field('Tema predefinito', `${p}.theme`, 'sel', { opts: [['classic', 'classico'], ...THEME_PRESETS.map(t => [t, t])] as [string, string][] })}
    <label class="edf"><span>Palette personalizzata</span><input type="checkbox" data-e-pal="${esc(r.id)}" ${pal ? 'checked' : ''}></label>${pal ? `<div class="edgrid">${field('Sfondo', `${p}.palette.bg`, 'c')}${field('Accento (bordi, bagliori)', `${p}.palette.accent`, 'c')}${field('Evidenza (pulsanti, titoli)', `${p}.palette.hi`, 'c')}</div>${sw}` : '<small>Senza palette si usa il tema predefinito.</small>'}
    ${field('Colore sulla mappa', `${p}.color`, 'c')}<div class="edgrid">${field('Posizione X sulla mappa (0-100)', `${p}.x`, 'n', { min: 0, max: 100 })}${field('Posizione Y (0-100)', `${p}.y`, 'n', { min: 0, max: 100 })}</div>
    <h4>Mosse nemiche dell'isola</h4><div class="edchecks">${S.data.enemyMoves.map((m: D) => `<label><input type="checkbox" data-arr="${p}.enemyMoves" data-val="${esc(m.id)}" ${(r.enemyMoves ?? []).includes(m.id) ? 'checked' : ''}> ${esc(tl(`enemyMove.${m.id}`, m, 'name'))}</label>`).join('')}</div></div></div>
    <h4>Capitoli (nemici)</h4>${enemies}${btn('+ Nuovo capitolo', 'newenemy', { id: r.id })}
    <p class="edfile">assets/foe-${esc(r.id)}.png ${ASSETS['foe-' + r.id] ? '✓' : '— mancante'}</p><div class="edact">${btn('↑ Sposta su', 'upreg', { id: r.id })}${btn('↓ Sposta giù', 'downreg', { id: r.id })}${btn('⎘ Duplica', 'dupreg', { id: r.id })}${btn('🗑 Elimina isola', 'delreg', { id: r.id, cls: 'danger' })}</div>`];
}

// ---- scelte di storia ----
function choicesView(): [string, string] {
  const sel = S.sel.choices, list = S.data.choices as D[], f = S.filter, q = S.q.toLowerCase(), reg = S.data.regions as D[];
  const vis = list.filter(c => (!f || c.region === f) && (!q || c.id.toLowerCase().includes(q) || tl(`choice.${c.id}`, c, 'title').toLowerCase().includes(q)));
  const l = `<div class="edtools"><input data-q type="search" placeholder="Cerca…" value="${esc(S.q)}"><select data-flt><option value="">Tutte le isole</option>${reg.map(r => `<option value="${esc(r.id)}" ${f === r.id ? 'selected' : ''}>${esc(tl(`region.${r.id}`, r, 'name') || r.id)}</option>`).join('')}</select></div>` + btn('+ Nuova scelta', 'newchoice', { cls: 'pri' }) + vis.map(c => `<div class="edi ${sel === c.id ? 'on' : ''}" data-e="sel" data-id="${esc(c.id)}"><div><b>${esc(tl(`choice.${c.id}`, c, 'title'))}</b><small>${esc(c.region)} · capitolo ${(c.at ?? 0) + 1}</small></div></div>`).join('');
  const c = list.find(x => x.id === sel); if (!c) return [l, '<p class="edhint">Seleziona una scelta. Ogni capitolo di ogni isola pesca una delle scelte ad esso associate.</p>']; const i = list.indexOf(c), p = `choices.${i}`, rg = reg.find(r => r.id === c.region);
  const opts = (c.options ?? []).map((o: D, k: number) => { const pts = choicePts(o.fx), ok = pts >= 1.6 && pts <= 2.5; return `<div class="edchap"><h5>Opzione ${k + 1} <small>${esc(o.id)}</small> <span class="edpts ${ok ? 'ok' : 'bad'}" title="Valore bilanciato 1.6–2.5">valore ${pts.toFixed(2)}</span></h5>${field('Testo dell\'opzione', `${p}.options.${k}.label`, 's', { tk: `choice.${c.id}.${o.id}.label` })}${field('Esito (mostrato dopo la scelta)', `${p}.options.${k}.text`, 's', { tk: `choice.${c.id}.${o.id}.text`, ml: true })}<div class="edgrid">${CHOICE_FX.map(fx => field({ gold: 'Oro (unità)', block: 'Scudo iniziale', energy: 'Energia 1° turno', draw: 'Pesca 1° turno', foeHp: 'PV nemico %', hp: 'PV iniziali' }[fx], `${p}.options.${k}.fx.${fx}`, 'o', { step: fx === 'gold' ? 0.5 : 1 })).join('')}</div></div>`; }).join('');
  return [l, `<div class="edcols"><div>${idField('Id', 'choice', c.id)}${field('Isola', `${p}.region`, 'sel', { opts: reg.map(r => [r.id, tl(`region.${r.id}`, r, 'name') || r.id]) })}${field('Capitolo', `${p}.at`, 'sel', { opts: (rg?.enemies ?? []).map((e: D, k: number) => [String(k), `${k + 1} · ${tl(`enemy.${e.id}`, e, 'name')}`]) })}</div><div>${field('Titolo della scena', `${p}.title`, 's', { tk: `choice.${c.id}.title` })}${field('Testo della scena ({nome} = protagonista)', `${p}.text`, 's', { tk: `choice.${c.id}.text`, ml: true })}</div></div>
    <p class="edhint">Bilanciamento: gold×1, scudo÷6, energia×1,5, carta×1, PV nemico −0,15 per %, PV iniziali×0,2. Ogni opzione dovrebbe valere circa 2 punti, così nessuna è "la migliore".</p>${opts}<div class="edact">${btn('⎘ Duplica', 'dupchoice', { id: c.id })}${btn('🗑 Elimina', 'delchoice', { id: c.id, cls: 'danger' })}</div>`];
}

// ---- mosse nemiche ----
function enemyView(): [string, string] {
  const list = S.data.enemyMoves as D[];
  return [btn('+ Nuova mossa nemica', 'newem', { cls: 'pri' }), `<p class="edhint">I valori sono moltiplicatori della potenza del nemico (danni, guardia e cura relativi).</p>${list.map((m, i) => `<div class="edchap"><div class="edgrid">${idField('Id (immagine enemycard-…)', 'enemyMove', m.id)}${field('Nome', `enemyMoves.${i}.name`, 's', { tk: `enemyMove.${m.id}.name` })}${field('Icona', `enemyMoves.${i}.icon`)}${field('Danni (×)', `enemyMoves.${i}.dmg`, 'o', { step: 0.1 })}${field('Colpi', `enemyMoves.${i}.hits`, 'o')}${field('Guardia (×)', `enemyMoves.${i}.block`, 'o', { step: 0.1 })}${field('Cura (×)', `enemyMoves.${i}.heal`, 'o', { step: 0.1 })}${field('Durata', `enemyMoves.${i}.dur`, 'o')}</div>${btn('🗑 Elimina', 'delem', { id: m.id, cls: 'danger' })}</div>`).join('')}`];
}

// ---- immagini ----
function imagesView(): [string, string] {
  const groups = imageKeys(S.data), all = groups.flatMap(g => g.rows), miss = all.filter(r => !ASSETS[r.key]).length;
  const body = `<p class="edhint">Il nome del file immagine è la <b>chiave</b> (senza estensione: png, jpg, webp, svg…) dentro la cartella <code>assets/</code>. Se cambi un id nell'Editor cambia anche il nome atteso del file. Dopo aver aggiunto le immagini lancia <code>npm run build</code>.</p>
    <div class="edact">${btn('⬇ Elenco immagini (CSV)', 'imgcsv')}${btn('⎘ Copia elenco chiavi', 'imgcopy')}${btn('⬇ Script rinomina immagini (.sh)', 'imgsh')}</div>
    <p>${all.length} chiavi · <b>${all.length - miss}</b> presenti · <b>${miss}</b> mancanti · ${S.renames.length} id rinominati</p>${S.renames.length ? `<details><summary>Rinominazioni registrate</summary>${S.renames.map(r => `<div class="edrow"><code>${esc(r.kind)}</code> ${esc(r.from)} → <b>${esc(r.to)}</b></div>`).join('')}</details>` : ''}
    ${groups.map(g => `<h4>${esc(g.title)} <small>${g.rows.length}</small></h4><table class="edtab">${g.rows.map(r => `<tr><td><code>${esc(r.key)}</code></td><td>${esc(r.label)}</td><td class="${ASSETS[r.key] ? 'ok' : 'bad'}">${ASSETS[r.key] ? '✓' : 'mancante'}</td></tr>`).join('')}</table>`).join('')}`;
  return ['', body];
}

// ---- generale ----
function configFields(o: any, p: string): string { return Object.entries(o).map(([k, v]) => typeof v === 'number' ? field(`${p.replace(/^config\.?/, '')}${p === 'config' ? '' : '.'}${k}`, `${p}.${k}`, 'n', { step: 'any' as any, cls: 'edsm' }) : typeof v === 'object' && v ? configFields(v, `${p}.${k}`) : '').join(''); }
function generalView(): [string, string] {
  const iss = validate(S.data), cur = langs();
  return ['', `<h4>Controlli <small>${iss.filter(i => i.level === 'err').length} errori · ${iss.filter(i => i.level === 'warn').length} avvisi</small></h4>${iss.length ? `<div class="edissues">${iss.slice(0, 120).map(i => `<div class="${i.level}">${i.level === 'err' ? '⛔' : '⚠'} ${esc(i.msg)}</div>`).join('')}${iss.length > 120 ? `<div class="warn">… e altri ${iss.length - 120}</div>` : ''}</div>` : '<p class="ok">✓ Nessun problema trovato.</p>'}
    <h4>Lingue dei contenuti</h4><p class="edhint">Lingua base: <b>${esc(langName(BASE_LANG))}</b> (testi nei campi). Le altre lingue salvano le traduzioni nel JSON sotto "i18n". Scegli la lingua di modifica in alto per tradurre i testi di carte, storie e scelte. Per mostrare una lingua anche nei menu serve il file dell'interfaccia (vedi data/locales/README).</p>
    <table class="edtab">${cur.map(l => { const [n, t] = translated(l); return `<tr><td><b>${esc(langName(l))}</b> <code>${esc(l)}</code></td><td>${n}/${t} testi</td><td>${l !== BASE_LANG ? btn('Rimuovi', 'dellang', { id: l, cls: 'danger' }) : 'base'}</td></tr>`; }).join('')}</table>
    <div class="edtools"><input data-newlang type="text" placeholder="codice (es. es, fr, de)" maxlength="5">${btn('+ Aggiungi lingua', 'addlang')}</div>
    <h4>Bilanciamento e regole</h4><div class="edgrid">${configFields(S.data.config, 'config')}</div>`];
}

// ---- schermata ----
function render() {
  const keep = host.querySelector('.edform')?.scrollTop ?? 0, keepL = host.querySelector('.edlist')?.scrollTop ?? 0, iss = validate(S.data), nerr = iss.filter(i => i.level === 'err').length, nwarn = iss.length - nerr;
  const views: Record<Tab, () => [string, string]> = { cards: cardsView, equip: equipView, styles: stylesView, islands: islandsView, choices: choicesView, enemy: enemyView, images: imagesView, general: generalView }, [l, f] = views[S.tab]();
  const active = CUSTOM ? '<span class="edtag">Dati personalizzati attivi nel gioco</span>' : '';
  host.innerHTML = `<div class="ed"><header class="edh"><h1>🛠 Editor</h1><label class="edlang"><span>Lingua di modifica</span><select data-e-lang>${langs().map(c => `<option value="${esc(c)}" ${S.lang === c ? 'selected' : ''} data-notr>${esc(langName(c))}</option>`).join('')}</select></label>${active}
    <div class="edhb">${btn('⬇ Esporta JSON', 'export', { cls: 'pri' })}${btn('⬆ Importa JSON', 'import')}${btn('▶ Prova nel gioco', 'apply', { title: 'Usa la bozza nel gioco senza toccare il repository' })}${btn('↩ Dati originali', 'restore', { title: 'Torna ai dati inclusi nel gioco' })}${btn('✕ Esci', 'exit')}</div><input type="file" id="edimport" accept=".json,application/json" hidden></header>
    <div class="edmsg">${S.msg ? esc(S.msg) : ''}<span class="edbadge ${nerr ? 'bad' : nwarn ? 'warn' : 'ok'}" data-e="tab" data-id="general">${nerr ? `⛔ ${nerr} errori` : ''} ${nwarn ? `⚠ ${nwarn} avvisi` : nerr ? '' : '✓ nessun problema'}</span></div>
    <nav class="edtabs">${TABS.map(([k, n]) => `<button class="${S.tab === k ? 'on' : ''}" data-e="tab" data-id="${k}">${n}</button>`).join('')}</nav>
    <div class="edbody ${S.tab === 'images' || S.tab === 'general' || S.tab === 'enemy' ? 'one' : ''}"><aside class="edlist">${l}</aside><section class="edform">${f}</section></div></div>`;
  const nf = host.querySelector('.edform'), nl = host.querySelector('.edlist'); if (nf) nf.scrollTop = keep; if (nl) nl.scrollTop = keepL;
}
const touch = (msg = '') => { S.msg = msg; save(); render(); };
const uniq = (list: D[], base: string) => { let n = 1; while (list.some((x: D) => x.id === `${base}_${n}`)) n++; return `${base}_${n}`; };

// ---- azioni ----
function download(name: string, text: string, mime = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
const d = () => S.data;
function act(e: string, id: string | undefined, i: number, slot: string | undefined) {
  const D = d();
  switch (e) {
    case 'tab': S.tab = id as Tab; S.q = ''; S.filter = ''; return touch();
    case 'sel': S.sel[S.tab] = id; return touch();
    case 'gotomove': S.tab = 'cards'; S.sel.cards = id; S.q = ''; S.filter = ''; return touch();
    case 'newmove': { const own = id || null, nid = newMove(D, own, own ? 'basic' : 'base'); S.sel.cards = nid; return touch('Carta creata: cambia id e nome.'); }
    case 'newmoveIn': { const nid = newMove(D, id!, slot as 'basic' | 'adv'); S.tab = 'cards'; S.sel.cards = nid; return touch('Carta creata.'); }
    case 'dupmove': { const n = dupMove(D, id!); if (n) S.sel.cards = n; return touch('Carta duplicata.'); }
    case 'delmove': if (!confirm(`Eliminare la carta "${id}"?`)) return; deleteMove(D, id!); S.sel.cards = undefined; return touch();
    case 'addlink': setP(D, id + '.effect.link', { from: D.baseMoves[0]?.id ?? '', dmg: 2 }); return touch();
    case 'dellink': delP(D, id + '.effect.link'); return touch();
    case 'addsyn': setP(D, id + '.effect.syn', { k: 'adrenaline', n: 1 }); return touch();
    case 'delsyn': delP(D, id + '.effect.syn'); return touch();
    case 'addreq': setP(D, id + '.effect.req', { hpBelow: 0.5 }); return touch();
    case 'delreq': delP(D, id + '.effect.req'); return touch();
    case 'neweq': { const nid = uniq(D.equipment, 'equip'); D.equipment.push({ id: nid, name: 'Nuovo equipaggiamento', desc: '', price: 20, bonus: {}, moves: [], advanced: [], island: D.regions[0]?.id ?? '', kind: 'gear' }); S.sel.equip = nid; for (let k = 0; k < 3; k++) newMove(D, nid, 'basic'); return touch('Equipaggiamento creato con 3 mosse da modificare.'); }
    case 'dupeq': { const q = D.equipment.find((x: D) => x.id === id), c = clone(q); c.id = uniq(D.equipment, id!); c.name += ' (copia)'; const ids = new Set(allMoves(D).map(r => r.m.id)); for (const m of [...c.moves, ...c.advanced]) { let n = 2; while (ids.has(`${m.id}_${n}`)) n++; m.id = `${m.id}_${n}`; ids.add(m.id); } D.equipment.push(c); S.sel.equip = c.id; return touch('Equipaggiamento duplicato.'); }
    case 'deleq': if (!confirm(`Eliminare l'equipaggiamento "${id}" e le sue mosse?`)) return; for (const m of [...D.equipment.find((x: D) => x.id === id).moves, ...D.equipment.find((x: D) => x.id === id).advanced]) deleteMove(D, m.id); D.equipment = D.equipment.filter((x: D) => x.id !== id); S.sel.equip = undefined; return touch();
    case 'newstyle': { const nid = uniq(D.styles, 'stile'); D.styles.push({ id: nid, name: 'Nuovo stile', icon: '🥋', desc: '', deck: D.styles[0]?.deck.slice() ?? [] }); S.sel.styles = nid; return touch(); }
    case 'delstyle': if (D.styles.length < 2) return touch('Serve almeno uno stile.'); if (!confirm(`Eliminare lo stile "${id}"?`)) return; D.styles = D.styles.filter((x: D) => x.id !== id); S.sel.styles = undefined; return touch();
    case 'deckdel': { const st = D.styles.find((x: D) => x.id === S.sel.styles); st?.deck.splice(i, 1); return touch(); }
    case 'newreg': { const nid = uniq(D.regions, 'isola'), n = D.config.matchesPerIsland ?? 5; D.regions.push({ id: nid, name: 'Nuova isola', level: 'Livello', concept: '', story: '', hero: '', theme: 'classic', palette: { bg: '#3a2a6b', accent: '#9b7bff', hi: '#ffd24a' }, color: '#9b7bff', x: 50, y: 50, enemyMoves: ['direct', 'heavy', 'guard'], enemies: Array.from({ length: n }, (_, k) => ({ id: `${nid}-${k + 1}`, name: `Nemico ${k + 1}`, story: '', ...(k === n - 1 ? { hpMul: 1.3, atkMul: 1.15 } : {}) })) }); S.sel.islands = nid; return touch('Isola creata: ricorda equipaggiamenti e scelte per questa isola.'); }
    case 'dupreg': { const r = D.regions.find((x: D) => x.id === id), c = clone(r), nid = uniq(D.regions, id!); c.id = nid; c.name += ' (copia)'; c.enemies.forEach((en: D, k: number) => { en.id = `${nid}-${k + 1}`; }); D.regions.push(c); S.sel.islands = nid; return touch(); }
    case 'delreg': if (D.regions.length < 2) return touch('Serve almeno un\'isola.'); if (!confirm(`Eliminare l'isola "${id}"? (equipaggiamenti e scelte collegati andranno sistemati a mano)`)) return; D.regions = D.regions.filter((x: D) => x.id !== id); S.sel.islands = undefined; return touch();
    case 'upreg': case 'downreg': { const k = D.regions.findIndex((x: D) => x.id === id), j = k + (e === 'upreg' ? -1 : 1); if (j >= 0 && j < D.regions.length) [D.regions[k], D.regions[j]] = [D.regions[j], D.regions[k]]; return touch(); }
    case 'newenemy': { const r = D.regions.find((x: D) => x.id === id); let n = r.enemies.length + 1; while (D.regions.some((q: D) => q.enemies.some((y: D) => y.id === `${id}-${n}`))) n++; r.enemies.push({ id: `${id}-${n}`, name: 'Nuovo nemico', story: '' }); return touch(`Capitolo aggiunto (il gioco prevede ${D.config.matchesPerIsland} capitoli per isola).`); }
    case 'delenemy': { const r = D.regions.find((x: D) => x.id === id); if (r.enemies.length < 2) return touch('Serve almeno un capitolo.'); r.enemies.splice(i, 1); return touch(); }
    case 'upenemy': case 'downenemy': { const r = D.regions.find((x: D) => x.id === id), j = i + (e === 'upenemy' ? -1 : 1); if (j >= 0 && j < r.enemies.length) [r.enemies[i], r.enemies[j]] = [r.enemies[j], r.enemies[i]]; return touch(); }
    case 'newchoice': { const reg = S.filter || D.regions[0]?.id, nid = uniq(D.choices, 'scelta'); D.choices.push({ id: nid, region: reg, at: 0, title: 'Nuova scena', text: '', options: [{ id: 'a', label: 'Opzione A', text: '', fx: { gold: 2 } }, { id: 'b', label: 'Opzione B', text: '', fx: { block: 12 } }, { id: 'c', label: 'Opzione C', text: '', fx: { draw: 2 } }] }); S.sel.choices = nid; return touch(); }
    case 'dupchoice': { const c = clone(D.choices.find((x: D) => x.id === id)); c.id = uniq(D.choices, id!); c.title += ' (copia)'; D.choices.push(c); S.sel.choices = c.id; return touch(); }
    case 'delchoice': if (!confirm('Eliminare questa scelta?')) return; D.choices = D.choices.filter((x: D) => x.id !== id); S.sel.choices = undefined; return touch();
    case 'newem': D.enemyMoves.push({ id: uniq(D.enemyMoves, 'mossa'), name: 'Nuova mossa', icon: '👊', dmg: 1 }); return touch();
    case 'delem': if (!confirm('Eliminare la mossa nemica?')) return; D.enemyMoves = D.enemyMoves.filter((x: D) => x.id !== id); for (const r of D.regions) r.enemyMoves = (r.enemyMoves ?? []).filter((x: string) => x !== id); return touch();
    case 'addlang': { const inp = host.querySelector('[data-newlang]') as HTMLInputElement, c = inp.value.trim().toLowerCase(); if (!/^[a-z]{2,5}$/.test(c)) return touch('Codice lingua non valido (es. es, fr, de).'); D.i18n ??= {}; D.i18n[c] ??= {}; S.lang = c; return touch(`Lingua ${c} aggiunta: ora traduci i testi (campi con il nome della lingua).`); }
    case 'dellang': if (!confirm('Eliminare tutte le traduzioni di questa lingua?')) return; delete D.i18n[id!]; if (S.lang === id) S.lang = BASE_LANG; return touch();
    case 'export': { const iss = validate(D).filter(x => x.level === 'err'); if (iss.length && !confirm(`Ci sono ${iss.length} errori. Esportare lo stesso?`)) return; download('game.json', JSON.stringify(D, null, 2)); return touch('game.json scaricato: sostituisci data/game.json nel repository.'); }
    case 'import': (host.querySelector('#edimport') as HTMLInputElement).click(); return;
    case 'apply': { const iss = validate(D).filter(x => x.level === 'err'); if (iss.length && !confirm(`Ci sono ${iss.length} errori: il gioco potrebbe non funzionare. Provare lo stesso?`)) return; try { store()?.setItem(CUSTOM_KEY, JSON.stringify(D)); } catch { return touch('Impossibile salvare (spazio esaurito).'); } location.reload(); return; }
    case 'restore': if (!confirm('Tornare ai dati originali del gioco? La bozza dell\'Editor andrà persa.')) return; try { store()?.removeItem(CUSTOM_KEY); store()?.removeItem(DRAFT_KEY); } catch { /* ignora */ } location.reload(); return;
    case 'exit': save(); onExit(); return;
    case 'imgcsv': download('immagini.csv', ['chiave,file,etichetta,stato', ...imageKeys(D).flatMap(g => g.rows.map(r => `${r.key},assets/${r.key}.png,"${r.label.replace(/"/g, '""')}",${ASSETS[r.key] ? 'presente' : 'mancante'}`))].join('\n'), 'text/csv'); return;
    case 'imgcopy': navigator.clipboard?.writeText(imageKeyList(D).join('\n')).then(() => touch('Elenco copiato negli appunti.'), () => touch('Copia non riuscita.')); return;
    case 'imgsh': if (!S.renames.length) return touch('Nessun id rinominato: non serve alcuno script.'); download('rinomina-immagini.sh', renameScript(S.renames), 'text/x-shellscript'); return;
  }
}
function onClick(ev: Event) { const b = (ev.target as HTMLElement).closest('[data-e]') as HTMLElement | null; if (!b) return; act(b.dataset.e!, b.dataset.id, +(b.dataset.i ?? 0), b.dataset.slot); }
function onChange(ev: Event) {
  const el = ev.target as HTMLInputElement & HTMLSelectElement; if (!el.dataset) return; const D = d();
  if (el.id === 'edimport') { const f = el.files?.[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (!j.baseMoves || !j.equipment || !j.regions || !j.styles || !j.config) throw new Error('struttura non valida'); if (!confirm('Sostituire la bozza con il file importato?')) return; S.data = j; S.renames = []; S.sel = {}; touch('File importato.'); } catch (x) { touch(`Importazione non riuscita: ${(x as Error).message}`); } }); return; }
  if ('eLang' in el.dataset) { S.lang = el.value; return touch(); }
  if ('flt' in el.dataset) { S.filter = el.value; return touch(); }
  if (el.dataset.own) { const [own, slot] = el.value.split(':'); const err = moveCard(D, el.dataset.own, own === 'base' ? null : own, (slot as 'basic' | 'adv') ?? 'base'); return touch(err ?? ''); }
  if ('deckadd' in el.dataset) { if (el.value) D.styles.find((x: D) => x.id === S.sel.styles)?.deck.push(el.value); return touch(); }
  if ('ePal' in el.dataset) { const r = D.regions.find((x: D) => x.id === el.dataset.ePal); if (el.checked) r.palette = { bg: r.color || '#3a2a6b', accent: '#9b7bff', hi: '#ffd24a' }; else delete r.palette; return touch(); }
  if (el.dataset.arr) { const arr: string[] = getP(D, el.dataset.arr) ?? []; const v = el.dataset.val!, on = el.checked; setP(D, el.dataset.arr, on ? [...arr.filter(x => x !== v), v] : arr.filter(x => x !== v)); return touch(); }
  if (el.dataset.rn) { const [kind, from] = el.dataset.rn.split(':') as [RenameKind, string]; const to = el.value.trim();
    if ((TUTORIAL_IDS[kind]?.includes(from)) && !confirm(`"${from}" è usato dal tutorial: rinominarlo lo renderà inutilizzabile. Continuare?`)) return touch();
    const err = renameId(D, kind, from, to); if (err) return touch(err); S.renames = addRename(S.renames, { kind, from, to }); const tab: Record<RenameKind, Tab> = { move: 'cards', equipment: 'equip', region: 'islands', enemy: 'islands', style: 'styles', enemyMove: 'enemy', choice: 'choices' }; if (S.sel[tab[kind]] === from) S.sel[tab[kind]] = to; return touch(to !== from ? `Id rinominato: ${from} → ${to}. Il file immagine atteso cambia di conseguenza (scheda Immagini).` : ''); }
  const p = el.dataset.p; if (!p) return; const k = el.dataset.k; let v: any;
  if (k === 'b') v = el.checked; else if (k === 'n') v = el.value === '' ? 0 : +el.value; else if (k === 'o') v = el.value === '' ? undefined : +el.value; else if (k === 'sel' && /\.at$/.test(p)) v = +el.value; else v = el.value;
  if (el.dataset.tk && S.lang !== BASE_LANG) { D.i18n ??= {}; D.i18n[S.lang] ??= {}; if (v === '' || v === undefined) delete D.i18n[S.lang][el.dataset.tk]; else D.i18n[S.lang][el.dataset.tk] = v; }
  else if (v === undefined || (k === 'b' && !v)) delP(D, p); else setP(D, p, v);
  touch();
}
function onInput(ev: Event) { const el = ev.target as HTMLInputElement; if (el.dataset && 'q' in el.dataset) { S.q = el.value; const pos = el.selectionStart; render(); const n = host.querySelector('[data-q]') as HTMLInputElement | null; if (n) { n.focus(); n.setSelectionRange(pos, pos); } } }

/** Apre l'Editor dentro `container` (sostituisce la schermata di gioco finché non si esce). */
export function openEditor(container: HTMLElement, exit: () => void) {
  host = container; onExit = exit;
  let draft: any = null; try { draft = JSON.parse(store()?.getItem(DRAFT_KEY) ?? 'null'); } catch { /* ignora */ }
  S = { data: draft?.data ?? clone(RAW), tab: draft?.tab ?? 'cards', sel: draft?.sel ?? {}, lang: draft?.lang ?? (LANG !== BASE_LANG && langs0().includes(LANG) ? LANG : BASE_LANG), q: '', filter: '', renames: draft?.renames ?? [], msg: draft ? 'Bozza precedente ripresa.' : '' };
  if (!langs().includes(S.lang)) S.lang = BASE_LANG;
  if (wired !== container) { wired = container; container.addEventListener('click', ev => { if (container.querySelector('.ed')) onClick(ev); }); container.addEventListener('change', ev => { if (container.querySelector('.ed')) onChange(ev); }); container.addEventListener('input', ev => { if (container.querySelector('.ed')) onInput(ev); }); }
  render();
}
