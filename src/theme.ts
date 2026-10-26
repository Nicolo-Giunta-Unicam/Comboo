// Palette di un'isola: 3 colori (sfondo, accento, evidenza) da cui si ricavano tutte le variabili CSS del tema.
export interface Palette { bg: string; accent: string; hi: string }
const rgb = (h: string): [number, number, number] => { const m = /^#?([0-9a-f]{6})$/i.exec(h.trim()); const n = parseInt(m ? m[1] : '808080', 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
const dark = (c: string, t: number) => mix(c, '#000000', t), light = (c: string, t: number) => mix(c, '#ffffff', t);
export const THEME_VARS = ['--bg0', '--bg1', '--pn1', '--pn2', '--bd', '--bd2', '--fld1', '--fld2', '--glowa', '--glow', '--btn1', '--btn2', '--ac1', '--ac2', '--acx', '--gold', '--p', '--p2'];
export function paletteVars(p: Palette): Record<string, string> {
  return { '--bg0': dark(p.bg, .8), '--bg1': p.bg, '--pn1': dark(p.bg, .5), '--pn2': dark(p.bg, .75), '--bd': p.accent, '--bd2': mix(p.accent, p.bg, .55), '--fld1': dark(p.bg, .12), '--fld2': dark(p.bg, .68), '--glowa': p.accent + '44', '--glow': p.accent,
    '--btn1': dark(p.bg, .3), '--btn2': dark(p.bg, .6), '--ac1': light(p.hi, .45), '--ac2': p.hi, '--acx': dark(p.hi, .85), '--gold': p.hi, '--p': dark(p.bg, .6), '--p2': dark(p.bg, .42) };
}
/** Applica (o rimuove) la palette personalizzata sull'elemento: ha la precedenza sulle classi th-<tema>. */
export function applyPalette(el: HTMLElement, p?: Palette | null) {
  if (p?.bg && p.accent && p.hi) for (const [k, v] of Object.entries(paletteVars(p))) el.style.setProperty(k, v); else for (const k of THEME_VARS) el.style.removeProperty(k);
}
