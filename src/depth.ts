// Effetto semi-3D: parallasse a più livelli, leggera prospettiva su campo/mappa/eroe e riflesso di luce sulle carte.
// Usa solo le proprietà individuali `translate` (compatibili con le animazioni CSS) e transform su elementi che NON contengono carte trascinabili
// (il drag usa position:fixed, che si romperebbe dentro un antenato trasformato).
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || document.body.classList.contains('calm');
const SHIFT: [string, number, number][] = [ // selettore, spostamento x/y massimo in px (profondità: più alto = più vicino)
  ['.mlogo', -9, -6], ['.mcards', 15, 9], ['.maptitle', -4, -3],
];
let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, bg: HTMLElement[] = [];
const BG_DEPTH = [10, 24, 46]; // livelli di sfondo: lontano, medio, vicino
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
// Particelle che salgono con velocità, deriva laterale, dimensione e opacità casuali; a ogni ciclo si rigenerano valori nuovi
function spawn(layer: HTMLElement, n: number, size: [number, number], dur: [number, number], op: [number, number]) {
  for (let i = 0; i < n; i++) {
    const b = document.createElement('b'), roll = () => { b.style.setProperty('--x', rnd(-2, 102).toFixed(1) + '%'); b.style.setProperty('--s', rnd(size[0], size[1]).toFixed(1) + 'px'); b.style.setProperty('--d', rnd(dur[0], dur[1]).toFixed(1) + 's'); b.style.setProperty('--sw', rnd(-90, 90).toFixed(0) + 'px'); b.style.setProperty('--o', rnd(op[0], op[1]).toFixed(2)); };
    roll(); b.style.animationDelay = (-rnd(0, dur[1])).toFixed(1) + 's'; b.addEventListener('animationiteration', roll); layer.appendChild(b);
  }
}

function frame() {
  raf = 0; const s = still(), gx = s ? 0 : tx, gy = s ? 0 : ty;
  cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
  if (Math.abs(gx - cx) < 0.01 && Math.abs(gy - cy) < 0.01) { cx = gx; cy = gy; }
  bg.forEach((e, i) => { e.style.translate = `${(-cx * BG_DEPTH[i]).toFixed(2)}px ${(-cy * BG_DEPTH[i] * 0.7).toFixed(2)}px`; });
  for (const [sel, px, py] of SHIFT) document.querySelectorAll<HTMLElement>(sel).forEach(e => { const v = `${(cx * px).toFixed(2)}px ${(cy * py).toFixed(2)}px`; if (e.style.translate !== v) e.style.translate = v; });
  const set = (sel: string, t: string) => document.querySelectorAll<HTMLElement>(sel).forEach(e => { if (e.style.transform !== t) e.style.transform = t; });
  set('.mapbox', `perspective(1500px) rotateX(${(7 - cy * 1.2).toFixed(2)}deg) rotateY(${(cx * 1.6).toFixed(2)}deg)`);
  document.querySelectorAll<HTMLElement>('.hfig .lyr').forEach(e => { e.style.translate = `${(-cx * 9).toFixed(2)}px ${(-cy * 5).toFixed(2)}px`; });
  if (Math.abs(gx - cx) > 0.01 || Math.abs(gy - cy) > 0.01) raf = requestAnimationFrame(frame);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

export function initDepth() {
  const d = document.createElement('div'); d.id = 'depth'; d.innerHTML = '<i class="d1"></i><i class="d2"></i><i class="d3"></i>'; document.body.prepend(d);
  bg = Array.from(d.querySelectorAll<HTMLElement>('i'));
  spawn(bg[1], 46, [2, 4.5], [7, 18], [0.35, 0.9]); spawn(bg[2], 16, [16, 40], [12, 26], [0.12, 0.34]);
  addEventListener('pointermove', ev => {
    tx = Math.max(-1, Math.min(1, (ev.clientX / innerWidth - 0.5) * 2)); ty = Math.max(-1, Math.min(1, (ev.clientY / innerHeight - 0.5) * 2)); kick();
    const c = (ev.target as HTMLElement | null)?.closest?.('.card:not(.back)') as HTMLElement | null; // riflesso di luce che segue il mouse sulla carta
    if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--px', ((ev.clientX - r.left) / r.width * 100).toFixed(0) + '%'); c.style.setProperty('--py', ((ev.clientY - r.top) / r.height * 100).toFixed(0) + '%'); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  new MutationObserver(kick).observe(document.getElementById('app')!, { childList: true }); // dopo ogni render si riapplica la prospettiva ai nuovi elementi
  kick();
}
