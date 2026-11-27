// Sfondo a immagine per arena. Sta SOTTO particelle ed effetti: #bgimg ha z-index -2, mentre #depth (polvere, sfere di luce) e gli effetti del menu stanno a -1.
// I file si mettono in assets/backgrounds/: menu-<arena>.* (store, storia, mazzo, abilità) e duel-<arena>.* (duelli), con <arena> = boxing, battlefield, desert, ocean, forest, volcano.
// Se un file non c'è non cambia nulla: resta lo sfondo di sempre. Il cambio di immagine avviene con una dissolvenza.
import { BACKGROUNDS } from './assets.generated';
const layers: HTMLElement[] = [], loaded = new Map<string, Promise<boolean>>(); let cur = '', front = 0, token = 0;
function mount() { if (layers.length) return; const box = document.createElement('div'); box.id = 'bgimg'; for (let i = 0; i < 2; i++) { const l = document.createElement('i'); box.appendChild(l); layers.push(l); } document.body.prepend(box); }
const preload = (url: string) => { let p = loaded.get(url); if (!p) { p = new Promise<boolean>(res => { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = url; }); loaded.set(url, p); } return p; };
const hide = () => { layers.forEach(l => l.classList.remove('on')); document.body.classList.remove('hasbg'); };
/** kind: 'menu' | 'duel' | null (nessuna immagine); arena: id dell'arena. Chiamabile a ogni render: non fa nulla se l'immagine richiesta è già quella mostrata. */
export function setBackdrop(kind: 'menu' | 'duel' | null, arena = '') {
  const key = kind && arena ? `${kind}-${arena}` : '', url = key ? BACKGROUNDS[key] : undefined, want = url ? key : '';
  if (want === cur) return; cur = want; const my = ++token;
  if (!url) { hide(); return; }
  mount();
  void preload(url).then(ok => {
    if (my !== token) return; // nel frattempo si è passati a un'altra schermata
    if (!ok) { cur = ''; hide(); return; }
    const next = layers[1 - front], prev = layers[front]; next.style.backgroundImage = `url("${url}")`; next.classList.add('on'); prev.classList.remove('on'); front = 1 - front; document.body.classList.add('hasbg');
  });
}
