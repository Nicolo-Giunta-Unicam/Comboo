// Effetti visivi a particelle (DOM + CSS): impatto, fortificazione, combo.
let host: HTMLElement | null = null;
const root = () => { if (!host) { host = document.createElement('div'); host.id = 'fx'; document.body.appendChild(host); } return host; };
const COL = { hit: ['#ffd77a', '#ff7a45', '#fff'], guard: ['#9fd0ff', '#5aa9ff', '#e6f3ff'], fw: ['#ff5e5e', '#ffd77a', '#7fe7ff', '#c58bff', '#7dffb0', '#ffffff'], combo: ['#ffd77a', '#ff7ab8', '#c58bff', '#fff'] };
function add(el: HTMLElement, x: number, y: number, ms: number) { el.style.left = x + 'px'; el.style.top = y + 'px'; root().appendChild(el); setTimeout(() => el.remove(), ms); }
export function burst(kind: 'hit' | 'guard' | 'combo' | 'fw', x: number, y: number) {
  if (document.body.classList.contains('calm')) return; const cols = COL[kind], n = kind === 'fw' ? 38 : kind === 'combo' ? 20 : 14;
  for (let i = 0; i < n; i++) { // guard: particelle che salgono (fortificazione); hit/combo: esplosione radiale
    const p = document.createElement('i'), a = kind === 'guard' ? -Math.PI / 2 + (Math.random() - .5) * 2.2 : Math.random() * 6.283, d = 30 + Math.random() * (kind === 'fw' ? 150 : kind === 'combo' ? 90 : 55);
    p.style.cssText = `--c:${cols[i % cols.length]};--s:${3 + Math.random() * 6}px;--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;animation-delay:${Math.random() * 90}ms`; add(p, x, y, 1000);
  }
  const r = document.createElement('div'); r.className = 'fx-ring'; r.style.setProperty('--c', cols[0]); add(r, x, y, 800);
  if (kind === 'guard') { const s = document.createElement('div'); s.className = 'fx-shield'; add(s, x, y, 1000); }
}
export function banner(text: string) { const b = document.createElement('div'); b.className = 'combofx'; b.innerHTML = `<b>🔥 COMBO!</b><small>${text}</small>`; document.body.appendChild(b); setTimeout(() => b.remove(), 1500); }
