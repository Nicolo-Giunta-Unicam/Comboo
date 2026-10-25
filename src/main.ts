import { CONFIG } from './config';
import { CHOICES, ENEMY_MOVES, EQUIPMENT, MOVES, STYLES, effectLines, moveOf, type ChoiceFx, type Move } from './data';
import { makeChoice, pendingChoice, choiceGold, chapterKey, scaledFx, beginArena, buyEnergy, buyOfferEq, buyOfferMv, buyEquipment, buyMove, endTurn, energyPrice, enemyStep, maxEnergy, maxHp, slotsFor, enemyFor, islandIndex, askMercy, setStyle, effCost, choosePick, drawDiscard, healRun, startHp, resolvePending, chooseRegion, unlocked, openMap, wins, sellCard, cardValue, newRun, ownedCards, playCard, sellEquipment, sellMove, toggleDeck, type Combat, type EnemyCard, type Placed, type Err, type Run } from './engine';
import { ART, bodyImg, customImg, eqIcon, layerImg } from './art';
import { tutActive, tutPatchCombat, tutPatchEnemy, tutStart, tutSync } from './tutorial';
import { REGIONS, REGION_LIST, type Region } from './regions';
import { banner, burst } from './fx';
import { config as audioCfg, setMode, sfx, unlock } from './audio';
import { clearRun, loadRun, saveRun } from './save';
const app = document.getElementById('app')!;
const ICON = new Proxy({} as Record<string, string>, { get: (_t, k: string) => EQUIPMENT[k] ? eqIcon(k, EQUIPMENT[k].kind) : undefined }); // icona dell'equipaggiamento (non per le carte base)
const FOE = ART.foe, foeArt = (art: string | undefined, tier: string, id?: string) => (id ? customImg('enemy-' + id) : undefined) ?? ART.region[art ?? ''] ?? FOE[tier];
const persist = (r: Run) => { if (!tutActive()) saveRun(r, localStorage); }; // il tutorial non tocca il salvataggio
const SET_KEY = 'cardrogue.settings.v1', DELAYS = [900, 450], LABELS = ['Normale', 'Veloce'];
const THEMES = ['classic', 'boxing', 'battle', 'forest', 'ocean', 'desert', 'ember']; // il tema dipende dalla regione scelta
const settings = { speed: 0, speedV: 2, calm: false, music: true, sfx: true, god: false, mv: 0.8, sv: 0.8, theme: 'classic', timer: true, tmode: 1, story: true }; try { const sv = JSON.parse(localStorage.getItem(SET_KEY) ?? '{}'); Object.assign(settings, sv); if (sv.speedV !== 2) settings.speed = (sv.speed ?? 1) >= 2 ? 1 : 0; settings.speedV = 2; } catch { /* ignora */ } // vecchie 4 velocità: Lenta/Normale -> Normale, Veloce/Rapida -> Veloce
if (!(settings.speed in DELAYS)) settings.speed = 0; if (![0, 1, 2].includes(settings.tmode)) settings.tmode = 1;
audioCfg(settings.music, settings.sfx, settings.mv, settings.sv); addEventListener('pointerdown', () => unlock());
let settingsOpen = false, sure = false, pileView: 'draw' | 'discard' | null = null;
let run = loadRun(localStorage), tab: 'sto' | 'st' | 'me' = 'sto', note = '', started = !!run && run.phase === 'combat', pop = { e: 0, p: 0 };
const kind = (m: Move) => m.effect.syn ? 'syn' : m.effect.dmg ? 'atk' : m.effect.block ? 'def' : 'utl';
const cardArt = (m: Move) => customImg('card-' + m.id) ?? ICON[m.source] ?? (m.effect.dmg ? ART.kind.atk : m.effect.block ? ART.kind.def : ART.kind.utl); // immagine della carta: card-<id> > icona equipaggiamento > tipo
function card(uid: string, o: { cls?: string; attr?: string; price?: number; badge?: string; cost?: number; sell?: number } = {}) {
  const m = MOVES[moveOf(uid)], e = m.effect;
  return `<div class="card ${kind(m)} ${o.cls ?? ''}" ${o.attr ?? ''}><span class="cost ${o.cost !== undefined && o.cost < m.cost ? 'disc' : ''}">${o.cost ?? m.cost}</span>${o.badge ? `<span class="bdg">${o.badge}</span>` : ''}<div class="nm">${m.name}</div><div class="art">${cardArt(m)}</div><div class="efs">${effectLines(e).map(l => `<div class="ef">${l}</div>`).join('')}</div>${o.sell !== undefined ? `<div class="sellv">💵 Vendita: +${o.sell}</div>` : ''}<div class="src">${m.effect.syn ? '✨ Sinergia · ' : ''}${m.source === 'base' ? 'Base' : EQUIPMENT[m.source].name}${o.price ? ` · 💰${o.price}` : ''}</div></div>`;
}
const bar = (v: number, mx: number, c = '') => `<div class="bar ${c}"><i style="width:${Math.max(0, v / mx * 100)}%"></i><b>${v}/${mx}</b></div>`;
const head = (r: Run) => `<div class="top"><span>⚔ ${REGIONS[r.region ?? '']?.name ?? 'Arena'} ${r.region ? Math.min(wins(r, r.region), CONFIG.matchesPerIsland) + '/' + CONFIG.matchesPerIsland : r.arena}</span><span>💰 ${r.god ? '∞' : r.gold}</span><span>❤ ${r.phase === 'combat' ? r.hp : startHp(r)}/${maxHp(r)}</span><span>🎴 ${r.deck.length}/${CONFIG.maxDeck}</span><span>⚡ ${maxEnergy(r)}/${CONFIG.maxEnergy}</span><span>🔧 ${r.equipped.length}/${r.slots}</span><button class="gear" data-a="set">⚙</button></div>`;
let prevDraw = -1, layersSeen: { run: Run | null; ids: Set<string> } = { run: null, ids: new Set() }, finalView: Combat | null = null, finalHp = 0, creating = false, draft = { name: '', av: 'a0', style: 'boxing' }, sailing = false, mapSel: string | null = null, vs: { tier: string; art?: string; id?: string; name: string; hp: number; lv: number } | null = null, prevEn = -1, lastSynN = 0, lastCombo = '', lastEv: unknown = null, endAnim: { win: boolean; tier: string; art?: string; id?: string } | null = null, lastPhase: string | undefined, prevHand: string[] = [], timer = 0, bars: { me: number; foe: number } | null = null;
// ---- Timer di turno (disattivabile): scaduto il tempo, il turno termina da solo; in pausa con impostazioni/menu ----
const TLIM = [10, 30, 60];
let tLeft = 0, tTurn = -1, tTick = 0, mercyIdle = false; // mercyIdle: riquadro della pietà aperto ma non ancora girato (il tempo scorre)
function paintTimer() {
  const b = document.querySelector('.end') as HTMLElement | null, f = b?.querySelector('.tfill') as HTMLElement | null, s = b?.querySelector('.tsec') as HTMLElement | null; if (!b || !f || !s) return;
  f.style.width = Math.max(0, tLeft / (TLIM[settings.tmode] * 1000)) * 100 + '%'; s.textContent = Math.ceil(Math.max(0, tLeft) / 1000) + 's'; b.classList.toggle('urgent', tLeft < 5000);
}
function timerSync() {
  const c = run?.combat; if (run?.phase !== 'combat') tTurn = -1;
  if (c && c.phase === 'player' && c.turn !== tTurn) { tTurn = c.turn; tLeft = TLIM[settings.tmode] * 1000; }
  const on = settings.timer && !!c && c.phase === 'player' && started && !settingsOpen && !vs && !endAnim && !tutActive() && (mercyIdle || !document.querySelector('.slotov'));
  if (!on) { clearInterval(tTick); tTick = 0; return; }
  if (!tTick) { let last = performance.now(); tTick = window.setInterval(() => { const n = performance.now(); tLeft -= n - last; last = n; paintTimer(); if (tLeft <= 0) { clearInterval(tTick); tTick = 0; pileView = null; if (mercyIdle) { mercyIdle = false; document.querySelector('.slotov')?.remove(); } act('end'); } }, 200); }
  paintTimer();
}
function tick() { // turno nemico: una carta alla volta, ripreso anche dopo un reload
  const c = run?.combat; if (timer || run?.phase !== 'combat' || !c || c.phase === 'player' || !started || settingsOpen || pileView || document.querySelector('.slotov')) return;
  timer = window.setTimeout(() => { timer = 0; if (!run || !started || settingsOpen || pileView || document.querySelector('.slotov')) return; const hp = run.hp, eh = run.combat?.enemy.hp ?? 0; const tier = run.combat?.enemy.tier ?? 'Strada', art = run.combat?.enemy.art, eid = run.combat?.enemy.id, snap: Combat | null = run.combat ? JSON.parse(JSON.stringify(run.combat)) : null, hp0 = run.hp; enemyStep(run); if (tutActive()) tutPatchEnemy(); pop.p = Math.max(0, hp - run.hp); pop.e = Math.max(0, eh - (run.combat?.enemy.hp ?? 0)); const ev = run.combat?.ev; if (pop.p || pop.e) sfx('hit'); else if (ev && ev.absorbed) sfx('shield'); if (run.phase !== 'combat' && snap) { // colpo finale: prima si vede l'attacco, poi i fuochi d'artificio (se vinci), poi la scena finale
      const win = run.phase === 'store'; if (win) snap.enemy.hp = 0; snap.ev = run.finalEv ?? null; (snap.phase === 'resolve' ? snap.field.off : snap.foeField.off).shift(); finalView = snap; finalHp = win ? hp0 : 0;
      const showEnd = () => { finalView = null; endAnim = { win, tier, art, id: eid }; render(); setTimeout(() => { endAnim = null; render(); }, 2800); };
      if (win) { setTimeout(fireworks, 1000); setTimeout(showEnd, 2900); } else setTimeout(showEnd, 1400);
    } persist(run); render(); }, DELAYS[settings.speed] ?? DELAYS[0]);
}
const badge = (c: Combat, u: string) => { const m = MOVES[moveOf(u)], g = m.effect.dmg ? 'off' : 'def', fg = m.effect.link && MOVES[m.effect.link.from]?.effect.dmg ? 'off' : 'def', p = CONFIG.combo.same[Math.min(c.lastBy?.[g] === m.id ? (c.runs?.[g] ?? 1) + 1 : 1, CONFIG.combo.max) - 1]; return [p ? `🔥+${Math.round(p * 100)}%` : '', m.effect.link && c.lastBy?.[fg] === m.effect.link.from ? '🔗' : ''].filter(Boolean).join(' '); };
function render() { hideTip(); if (run) { run.god = settings.god && !tutActive(); if (run.god && run.gold < GOD) run.gold = GOD; }
  if (!finalView) { if (lastPhase === 'combat' && run?.phase === 'store') { sfx(run.outcome === 'win' ? 'win' : 'click'); tab = 'sto'; } else if (lastPhase === 'combat' && run?.phase === 'over') sfx('lose'); lastPhase = run?.phase; } setMode(run?.phase === 'combat' && started ? 'combat' : 'calm'); document.body.classList.toggle('fs', (run?.phase === 'combat' || !!finalView) && started); document.body.classList.toggle('st', !!run && started && run.phase === 'store' && !finalView); document.body.classList.toggle('calm', settings.calm); const thId = run && started && run.phase !== 'over' && !(run.phase === 'store' && run.needsMap) ? REGIONS[run.region ?? '']?.theme ?? 'classic' : 'classic'; THEMES.forEach(t => document.body.classList.toggle('th-' + t, t === thId)); draw(); if (settingsOpen) app.insertAdjacentHTML('beforeend', modal()); else if (pileView && run?.combat) app.insertAdjacentHTML('beforeend', pileModal()); if (run?.pending && started && !settingsOpen) choiceModal(); if (run?.combat?.pick?.length && started && !settingsOpen) pickModal(); tick(); timerSync(); tutSync(); }
function drawMap(r: Run) { // oceano con isola centrale + 5 isole a pentagono; hover = contorno tratteggiato lampeggiante; si salpa in barca
  const BP = 'M-9 0Q-8.5 -6 -2 -6.5Q6 -7.5 9 -1Q10 5 2 6.5Q-6 7 -9 0Z', ROT = [0, -12, 18, -8, 24, 10], here = REGIONS[r.region ?? 'boxing'] ?? REGION_LIST[0], sel = mapSel ? REGIONS[mapSel] : null;
  const ul = unlocked(r), src = (id: string) => /src="([^"]+)"/.exec(ART.region[id])?.[1] ?? '';
  const isl = REGION_LIST.map((g, i) => { const s = g.id === 'boxing' ? 1.3 : 1, t = `translate(${g.x} ${g.y}) rotate(${ROT[i % 6]})`; return `<g class="isl ${sel?.id === g.id ? 'sel' : ''} ${ul.includes(g.id) ? '' : 'locked'}" data-a="region" data-id="${g.id}"><path class="outl" d="${BP}" transform="${t} scale(${s * 1.38})"/><path d="${BP}" transform="${t} scale(${s * 1.13})" fill="#f0dca0"/><path d="${BP}" transform="${t} scale(${s})" fill="${g.color}"/><path d="${BP}" transform="${t} scale(${s * .6})" fill="#fff" opacity=".14"/><image href="${src(g.id)}" x="${g.x - 4.5 * s}" y="${g.y - 4.5 * s}" width="${9 * s}" height="${9 * s}"/></g>`; }).join('');
  const sea = `<svg class="mapsvg" viewBox="0 0 100 60"><defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b6aa5"/><stop offset="1" stop-color="#08294a"/></linearGradient><pattern id="wv" width="8" height="6" patternUnits="userSpaceOnUse"><path d="M0 3q2-2 4 0t4 0" stroke="#ffffff33" fill="none" stroke-width=".3"/></pattern></defs><rect width="100" height="60" fill="url(#sea)"/><g class="waves"><rect x="-8" width="116" height="60" fill="url(#wv)"/></g>${isl}</svg>`;
  const labels = REGION_LIST.map(g => `<span class="ilabel" style="left:${g.x}%;top:${(g.y + (g.id === 'boxing' ? 9.5 : 8)) / 60 * 100}%">${ul.includes(g.id) ? '' : '🔒 '}${g.name}${ul.includes(g.id) ? ` ${wins(r, g.id)}/${CONFIG.matchesPerIsland}` : ''}</span>`).join('');
  const pm = `<div class="pmark" style="left:${here.x}%;top:${(here.y - 9.5) / 60 * 100}%"><div class="pm">${heroImg()}</div></div>`;
  const info = sel ? `<div><b>${sel.name}</b><br><small>${sel.level} · ${sel.concept}<br>Partite ${wins(r, sel.id)}/${CONFIG.matchesPerIsland} · Nemici: ${sel.enemies.map(x => x.name).slice(0, 3).join(', ')}…</small></div><button class="pri" data-a="sail">${sel.id === here.id ? '⚔ Combatti qui' : '⛵ Salpa per ' + sel.name}</button>` : '<small>Tocca un\'isola per sceglierla.</small>';
  app.innerHTML = `${head(r)}${r.msg ? `<div class="toast ok">${r.msg}</div>` : ''}<div class="mapscr"><div class="maptitle">🗺 Dove vuoi andare? · Arena ${r.arena}</div><div class="mapwrap"><div class="mapbox">${sea}${labels}${pm}</div></div><div class="mapinfo">${info}</div></div>`;
  const wrap = app.querySelector('.mapwrap') as HTMLElement, box = app.querySelector('.mapbox') as HTMLElement, w = Math.min(wrap.clientWidth, wrap.clientHeight * 100 / 60); box.style.width = w + 'px'; box.style.height = w * 0.6 + 'px';
}
function sail() { // il protagonista raggiunge l'isola scelta in barca (animazione a rAF, indipendente dal DOM della mappa), poi si passa allo store
  if (sailing || !mapSel || !run) return; const to = REGIONS[mapSel], from = REGIONS[run.region ?? 'boxing'] ?? REGION_LIST[0], box = app.querySelector('.mapbox') as HTMLElement | null; if (!to || !box) return;
  if (to.id === from.id) { act('enter'); return; }
  sailing = true; const R = box.getBoundingClientRect(), P = (g: Region) => [R.left + g.x / 100 * R.width, R.top + g.y / 60 * R.height], [x1, y1] = P(from), [x2, y2] = P(to);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, bow = from.id === 'boxing' || to.id === 'boxing' ? 0 : 0.7, cx = mx + (mx - (R.left + R.width / 2)) * bow, cy = my + (my - (R.top + R.height / 2)) * bow; // le rotte tra isole esterne girano al largo
  const sz = R.width * 0.11, boat = document.createElement('div'); boat.className = 'boat'; boat.innerHTML = `${ART.boat}<div class="bh">${heroImg()}</div>`;
  Object.assign(boat.style, { position: 'fixed', left: x1 + 'px', top: y1 + 'px', width: sz + 'px', height: sz + 'px', zIndex: '200', transform: `translate(-50%,-70%) scaleX(${x2 < x1 ? -1 : 1})` });
  document.body.appendChild(boat); box.querySelector('.pmark')?.classList.add('gone'); sfx('draw');
  const t0 = performance.now(), step = (now: number) => {
    const p = Math.min(1, (now - t0) / 2400), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, u = 1 - e;
    boat.style.left = u * u * x1 + 2 * u * e * cx + e * e * x2 + 'px'; boat.style.top = u * u * y1 + 2 * u * e * cy + e * e * y2 + 'px';
    if (p < 1) requestAnimationFrame(step); else { boat.remove(); sailing = false; sfx('fort'); act('enter'); }
  }; requestAnimationFrame(step);
}
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const heroName = () => esc(run?.hero?.name ?? 'Protagonista');
/** Effetti di un'opzione di scelta come etichette (bonus verdi, malus rossi). Gli effetti non in oro valgono per il prossimo duello. */
/** Il mazzo è appena finito: la pila trema in rosso, compare un avviso e suona un allarme (il pulsante ♻ lampeggia finché non viene premuto). */
function deckEmptyAlert() {
  const p = app.querySelector('.pile.draw') as HTMLElement | null; if (!p) return; p.classList.add('alert'); sfx('warn');
  const q = p.getBoundingClientRect(), t = document.createElement('div'); t.className = 'deckfx'; t.textContent = '🂠 Mazzo finito!'; t.style.left = q.left + q.width / 2 + 'px'; t.style.top = q.top + 'px'; document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
const fxChips = (r: Run, fx: ChoiceFx, gold = choiceGold(r, fx)) => [
  gold && `<i class="${gold < 0 ? 'neg' : ''}">💰 ${gold > 0 ? '+' : ''}${gold}</i>`, fx.block && `<i>🛡️ Scudo ${fx.block} a inizio duello</i>`, fx.energy && `<i>⚡ +${fx.energy} energia al 1° turno</i>`, fx.draw && `<i>🂠 Pesca +${fx.draw} al 1° turno</i>`,
  fx.foeHp && `<i class="${fx.foeHp > 0 ? 'neg' : ''}">👊 Nemico ${fx.foeHp > 0 ? '+' : ''}${fx.foeHp}% PV</i>`, fx.hp && `<i class="${fx.hp < 0 ? 'neg' : ''}">❤ ${fx.hp > 0 ? '+' : ''}${fx.hp} PV a inizio duello</i>`].filter(Boolean).join('');
const heroImg = () => { const a = run?.hero?.avatar; return a?.startsWith('data:') ? `<img class="ic photo" alt="" src="${a}">` : ART.avatar[a ?? 'a0'] ?? ART.avatar.a0; };
function drawCreate() { // creazione del personaggio: nome e foto profilo (avatar o foto caricata)
  const big = draft.av.startsWith('data:') ? `<img class="ic photo" alt="" src="${draft.av}">` : ART.avatar[draft.av];
  app.innerHTML = `<div class="creat"><h2>👤 Crea il tuo combattente</h2><div class="cprev"><div class="cface">${big}</div><div class="nameplate big">${esc(draft.name) || 'Protagonista'}</div></div><input id="nm" class="nmin" maxlength="16" placeholder="Il tuo nome" value="${esc(draft.name)}">
    <div class="avgrid">${Object.keys(ART.avatar).map(k => `<button class="avb ${draft.av === k ? 'on' : ''}" data-a="avatar" data-id="${k}">${ART.avatar[k]}</button>`).join('')}<label class="avb upl" title="Carica una foto">📷<input type="file" accept="image/*" id="photo" hidden></label></div>
    <div class="stylerow">${STYLES.map(x => `<button class="stb ${draft.style === x.id ? 'on' : ''}" data-a="style" data-id="${x.id}"><span class="sti">${x.icon}</span><b>${x.name}</b><small>${x.desc}</small></button>`).join('')}</div><small class="stlore">${STYLE_LORE[draft.style] ?? ''}</small>
    <div class="crow"><button data-a="cancelnew">Indietro</button><button class="pri" data-a="startrun">⚔ Inizia</button></div></div>`;
}
function countUp(el: HTMLElement) { // il numero di danni/difesa sale da 0 al valore
  const n = +el.dataset.n!, p = el.textContent!.replace(/\d+$/, ''), t0 = performance.now(); const f = (t: number) => { const k = Math.min(1, (t - t0) / 450); el.textContent = p + Math.round(n * k); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
}
function fireworks() { // fuochi d'artificio ai lati dell'arena
  const q = app.getBoundingClientRect(); for (let i = 0; i < 8; i++) setTimeout(() => { const right = i % 2 === 1, mg = right ? innerWidth - q.right : q.left, k = 0.25 + Math.random() * 0.5, x = mg > 50 ? (right ? q.right + mg * k : q.left - mg * k) : (right ? innerWidth - 30 : 30); burst('fw', x, innerHeight * (0.15 + Math.random() * 0.45)); sfx('firework'); }, i * 200);
}
function pickModal() { // Stratega: scelta di una tra le prime 3 carte del mazzo
  const c = run?.combat; if (!c?.pick?.length || document.querySelector('.pickov')) return;
  const ov = document.createElement('div'); ov.className = 'slotov pickov'; ov.innerHTML = `<div class="slotbox"><h2>🔍 Stratega: scegli una carta</h2><div class="pickrow">${c.pick.map(u => `<div class="pk" data-pick="${u}">${card(u, { cost: 1 })}</div>`).join('')}</div><small>Va in mano e, se la giochi questo turno, costa 1.</small></div>`; document.body.appendChild(ov);
  ov.onclick = ev => { const t = (ev.target as HTMLElement).closest('[data-pick]') as HTMLElement | null; if (!t || !run) return; const err = choosePick(run, t.dataset.pick!); if (err) note = err; ov.remove(); persist(run); render(); };
}
let stash: { run: Run | null; started: boolean; tab: 'sto' | 'st' | 'me' } | null = null;
/** Tutorial: gira su una run di prova (mai salvata) e poi ripristina quella reale. */
function startTutorial() {
  stash = { run, started, tab }; const r = newRun(11); r.hero = { name: 'Recluta', avatar: 'a0' }; setStyle(r, 'boxing'); r.gold = 90; r.offers = { eq: ['wraps', 'stance', 'footwork'], mv: [null, null, null], eqPrice: r.offers.eqPrice, mvPrice: r.offers.mvPrice };
  run = r; started = true; tab = 'sto'; mapSel = null; settingsOpen = false;
  tutStart({ run: () => run, tab: () => tab, mapSel: () => mapSel, busy: () => !!vs || !!finalView || !!endAnim || sailing, render, exit: () => { run = stash?.run ?? null; started = false; tab = stash?.tab ?? 'sto'; stash = null; vs = null; finalView = null; endAnim = null; render(); } }); render();
}
function drawVs() { // schermata di presentazione del duello
  const v = vs!; app.innerHTML = `<div class="vsscene"><div class="vsside l"><div class="vsimg">${heroImg()}</div><div class="vsname">${heroName()}</div><small>❤ ${maxHp(run!)} · 🔧 ${run!.equipped.length} equip.</small></div><div class="vstxt">VS</div><div class="vsside r"><div class="vsimg">${foeArt(v.art, v.tier, v.id)}</div><div class="vsname">${v.name}</div><small>❤ ${v.hp} · ${v.tier}</small></div><button class="vsskip" data-a="skipvs">Tocca per iniziare</button></div>`;
}
function drawEnd() { // animazione finale: il perdente va KO, il vincitore esulta, poi si passa alla schermata successiva
  const a = endAnim!; app.innerHTML = `<div class="endscene ${a.win ? 'win' : 'lose'}"><div class="stage"><div class="eh hero">${heroImg()}</div><div class="eh foe">${foeArt(a.art, a.tier, a.id)}</div></div><div class="endbanner">${a.win ? '🏆 VITTORIA!' : '💀 SCONFITTA'}</div></div>`;
  const ctr = (sel: string) => { const q = (app.querySelector(sel) as HTMLElement).getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; };
  const [lx, ly] = ctr(a.win ? '.eh.foe' : '.eh.hero'), [wx, wy] = ctr(a.win ? '.eh.hero' : '.eh.foe');
  [100, 450, 800].forEach(d => setTimeout(() => burst('hit', lx, ly), d)); setTimeout(() => burst('combo', wx, wy), 900);
}
function draw() {
  if (creating) { drawCreate(); return; }
  if (vs) { drawVs(); return; }
  if (endAnim) { drawEnd(); return; }
  if (run?.phase !== 'combat' && !finalView) { pileView = null; bars = null; prevHand = []; prevDraw = -1; lastCombo = ''; lastEv = null; lastSynN = 0; }
  const r = run, t = note ? `<div class="toast">${note}</div>` : '';
  if (!r || (!started && r.phase !== 'over')) {
    app.innerHTML = `<div class="logo">COMB<span class="inf">∞</span></div><p style="text-align:center"><small>Prototipo — ambientazione provvisoria. Da lottatore umano a potenza cosmica.</small></p>${r ? `<button class="pri" data-a="cont" style="width:100%">Continua run (arena ${r.arena})</button><br><br>` : ''}<button data-a="new" style="width:100%">Nuova run</button><br><br><button data-a="tutorial" style="width:100%">📘 Tutorial</button><br><br><button data-a="set" style="width:100%">⚙ Impostazioni</button>`; return;
  }
  if (r.phase === 'over' && !finalView) { app.innerHTML = `<div class="logo" style="font-size:36px">SCONFITTA</div><div class="item"><div class="big">💀</div>Arene superate: <b>${r.arena - 1}</b><small>Regola provvisoria: la sconfitta termina la run.</small></div><br><button class="pri" data-a="new" style="width:100%">Nuova run</button><br><br><button data-a="menu" style="width:100%">🏠 Menu principale</button>`; return; }
  if (r.phase === 'combat' || finalView) {
    const c = finalView ?? r.combat!, php = finalView ? finalHp : r.hp, e = c.enemy, n = c.hand.length, busy = c.phase !== 'player', me = maxEnergy(r), ev = c.ev;
    const reqOk = (mv: Move) => { const q = mv.effect.req; return !q || ((q.hpBelow === undefined || php / maxHp(r) < q.hpBelow) && (q.minTurn === undefined || c.turn >= q.minTurn)); };
    const ico = (p: Placed) => (p.mv ? customImg('card-' + p.mv) : p.src.startsWith('enemy:') ? customImg('enemycard-' + p.src.slice(6)) : undefined) ?? ART.emoji[p.icon] ?? ICON[p.src] ?? (p.dmg ? ART.kind.atk : ART.kind.def);
    // Carta schierata: stesso formato della carta in mano, con i valori attuali (combo incluse) e la durata residua.
    const pcard = (p: Placed, k: 'off' | 'def', extra = '') => {
      const m = p.mv ? MOVES[p.mv] : null;
      const rest = m ? effectLines(m.effect).filter(l => !/^(⚔️|⏳)/.test(l) && !(k === 'def' && l.startsWith('🛡️'))) : [p.fx ?? ''];
      const lines = [k === 'off' ? `⚔️ Danni ${p.dmg}${p.hits > 1 ? '×' + p.hits : ''}` : `🛡️ Guardia ${p.block}`, k === 'def' ? `⏳ ${p.ttl < 0 ? 'Finché abbattuta' : p.ttl + (p.ttl > 1 ? ' turni' : ' turno')}` : '', ...rest, p.tag ?? ''].filter(Boolean);
      return `<div class="card ${m ? kind(m) : k === 'off' ? 'atk' : 'def'} ${m ? '' : 'foe'} ${extra} ${p.id === c.fresh ? 'new' : ''}">${m ? `<span class="cost">${m.cost}</span>` : ''}<div class="nm">${p.name}</div><div class="art">${ico(p)}</div><div class="efs">${lines.map(l => `<div class="ef">${l}</div>`).join('')}</div><div class="src">${m ? (m.source === 'base' ? 'Base' : EQUIPMENT[m.source].name) : 'Nemico'}</div></div>`;
    };
    const rw = (a: Placed[], k: 'off' | 'def', fl = false) => `<div class="rowf ${k} ${a.length > 3 ? 'rt' : ''} ${fl ? 'flash' : ''}"><i>${k === 'off' ? 'OFFESA' : 'DIFESA'}</i>${a.map(p => pcard(p, k)).join('')}</div>`;
    const sh = (a: Placed[]) => a.reduce((s, p) => s + p.block, 0);
    const evh = ev ? `<div class="evw ${ev.by}"><div class="evc">${pcard(ev.card, 'off')}</div><div class="evt">${ev.absorbed ? `<div class="evn blk" data-n="${ev.absorbed}">🛡️ −${ev.absorbed}</div>` : ''}${ev.dmg ? `<div class="evn dmg" data-n="${ev.dmg}">💥 −${ev.dmg}</div>` : ''}${!ev.dmg && !ev.absorbed ? '<div class="evn blk">0</div>' : ''}</div></div>` : '';
    const em = (ids: string[], n: number) => `<div class="eqcol">${ids.map(id => `<div class="em" data-eq="${id}"><span>${ICON[id]}</span><small>${EQUIPMENT[id].name.split(' ')[0]}</small></div>`).join('')}${Array.from({ length: Math.max(0, n - ids.length) }, () => '<div class="em empty"><span>＋</span></div>').join('')}</div>`;
    const eqh = em(r.equipped, r.slots), eqf = em(e.gear ?? [], slotsFor(r.arena));
    const to = { me: php / maxHp(r) * 100, foe: e.hp / e.maxHp * 100 }, bar0 = bars ?? to; bars = to;
    const side = (mine: boolean, hp: number, mx: number, shield: number, dmg: number, face: string, label: string, name: string, from: number, eqh = '') => `<div class="side ${mine ? 'me' : 'foe'} ${dmg ? 'hit' : ''}" title="${name}">${dmg ? `<span class="pop">-${dmg}</span>` : ''}<div class="sidetop"><div class="vbar"><i class="${hp / mx < .25 ? 'low' : hp / mx < .5 ? 'mid' : ''}" data-to="${Math.max(0, hp / mx * 100)}" style="height:${from}%"></i></div>${eqh}</div><div class="face">${face}</div><div class="nameplate">${name}</div><b>${hp}<small>/${mx}</small></b><div class="sh">🛡️ ${shield}</div><small>${label}</small></div>`;
    app.innerHTML = `${head(r)}${t}<div class="field" data-zone="field">${evh}<div class="arena">
      ${side(true, php, maxHp(r), c.block + sh(c.field.def), pop.p, heroImg(), `Turno ${c.turn}`, heroName(), bar0.me, eqh)}
      <div class="board">${rw(c.foeField.def, 'def', ev?.by === 'me' && ev.absorbed > 0)}${rw(c.foeField.off, 'off')}
      <div class="mat">${busy ? `<div class="matr"><small>${c.phase === 'resolve' ? 'Attacchi in corso…' : 'Turno avversario…'}</small><span class="back">${'🂠'.repeat(c.queue.length)}</span></div><div class="combo">&nbsp;</div>` : `<div class="matr"><div class="pips">⚡ ${c.energy}/${me}</div>${c.draw.length === 0 && c.discard.length ? `<button class="mercy ${c.energy < CONFIG.discardDrawCost || c.hand.length >= CONFIG.maxHand ? '' : 'blink'}" data-a="ddraw" title="Rimescola gli scarti nel mazzo e pesca 1 carta" ${c.energy < CONFIG.discardDrawCost || c.hand.length >= CONFIG.maxHand ? 'disabled' : ''}>♻ ${CONFIG.discardDrawCost}⚡</button>` : ''}<button class="mercy" data-a="mercy" ${c.mercy ? 'disabled' : ''}>🙏 Pietà${c.mercy ? ' (usata)' : ''}</button><button class="pri end" data-a="end">${settings.timer ? '<i class="tfill" style="width:${Math.max(0, Math.min(1, tLeft / (TLIM[settings.tmode] * 1000))) * 100}%"></i>' : ''}<span>Fine turno ⚔</span>${settings.timer ? '<b class="tsec"></b>' : ''}</button></div><div class="combo">${c.combo ? '🔥 ' + c.combo : '&nbsp;'}</div>`}</div>
      ${rw(c.field.off, 'off')}${rw(c.field.def, 'def', ev?.by === 'foe' && ev.absorbed > 0)}</div>
      ${side(false, e.hp, e.maxHp, sh(c.foeField.def), pop.e, foeArt(e.art, e.tier, e.id), `${(wins(r, r.region ?? '') % CONFIG.matchesPerIsland) + 1}/${CONFIG.matchesPerIsland}`, e.tier, bar0.foe, eqf)}
    </div></div>
    <div class="handrow"><div class="hand">${c.hand.map((u, i) => card(u, { cls: !busy && c.energy >= effCost(c, u) && reqOk(MOVES[moveOf(u)]) ? '' : 'off', cost: effCost(c, u), badge: busy ? '' : badge(c, u), attr: `data-drag="${u}" style="--i:${i};--n:${n}"` })).join('')}</div><div class="pile disc" data-a="pile" data-id="discard" title="Carte già giocate"><b>${c.discard.length}</b><small>Scarti</small></div><div class="pile draw ${c.draw.length ? '' : 'empty'}" data-a="pile" data-id="draw" title="Carte rimaste nel mazzo"><b>${c.draw.length}</b><small>Mazzo</small></div></div>`;
    const pr = (app.querySelector('.pile.draw') as HTMLElement).getBoundingClientRect(); let dealt = 0; // animazione di pesca: le carte nuove arrivano dal mazzo
    app.querySelectorAll<HTMLElement>('.hand .card').forEach(el => { if (prevHand.includes(el.dataset.drag!)) return; const q = el.getBoundingClientRect(); el.style.setProperty('--dx', pr.left + pr.width / 2 - q.left - q.width / 2 + 'px'); el.style.setProperty('--dy', pr.top + pr.height / 2 - q.top - q.height / 2 + 'px'); el.style.animationDelay = dealt * 110 + 'ms'; setTimeout(() => sfx('deal'), dealt * 110); dealt++; el.classList.add('dealt'); });
    prevHand = [...c.hand];
    if (prevDraw > 0 && c.draw.length === 0) deckEmptyAlert(); prevDraw = c.draw.length; // il mazzo è appena finito: avviso
    const nw = app.querySelector('.rowf .card.new') as HTMLElement | null; // carta appena schierata: impatto (offesa) o fortificazione (difesa)
    if (nw) { const q = nw.getBoundingClientRect(), off = (nw.parentElement as HTMLElement).classList.contains('off'); burst(off ? 'hit' : 'guard', q.left + q.width / 2, q.top + q.height / 2); sfx(off ? 'place' : 'fort');
      if (c.combo && c.combo !== lastCombo) { burst(c.tier === 2 ? 'fw' : 'combo', q.left + q.width / 2, q.top + q.height / 2); banner(c.combo, c.tier === 2); sfx('combo'); } }
    lastCombo = c.combo;
    if (c.syn && c.syn.n !== lastSynN) { banner(c.syn.text, false, '✨ SINERGIA'); sfx('combo'); } lastSynN = c.syn?.n ?? 0;
    if (ev && ev !== lastEv) { // attivazione a fine turno: impatto sul bersaglio, fortificazione sulla riga difensiva che assorbe
      app.querySelectorAll<HTMLElement>('.evn[data-n]').forEach(countUp); if (ev.dmg > 0) { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 380); }
      const tgt = app.querySelector(ev.by === 'me' ? '.side.foe .face' : '.side.me .face') as HTMLElement, rows = app.querySelectorAll<HTMLElement>('.rowf');
      if (ev.dmg > 0 || ev.absorbed === 0) { const q = tgt.getBoundingClientRect(); burst('hit', q.left + q.width / 2, q.top + q.height / 2); }
      if (ev.absorbed > 0) { const q = rows[ev.by === 'me' ? 0 : 3].getBoundingClientRect(); burst('guard', q.left + q.width / 2, q.top + q.height / 2); } }
    lastEv = ev;
    requestAnimationFrame(() => requestAnimationFrame(() => app.querySelectorAll<HTMLElement>('.vbar i').forEach(i => { i.style.height = i.dataset.to + '%'; })));
    const fd = app.querySelector('.field') as HTMLElement, mt = app.querySelector('.mat') as HTMLElement; fd.scrollTop = mt.offsetTop - fd.clientHeight / 2; // centra il campo sulla zona di scontro
    c.fresh = 0; pop = { e: 0, p: 0 }; return;
  }
  if (r.phase === 'store' && r.needsMap) { drawMap(r); return; }
  const own = ownedCards(r); let body = '';
  const eqCard = (id: string, i: number) => { const e = EQUIPMENT[id], bn = [e.bonus.maxHp && `❤ +${e.bonus.maxHp} PV max`, e.bonus.dmg && `⚔️ +${e.bonus.dmg} danni`].filter(Boolean) as string[]; return `<div class="card eqc" data-eq="${id}" ${i >= 0 ? `data-drag="offer:eq:${i}"` : `data-drag="eqs:${id}"`}><div class="nm">${e.name}</div><div class="art">${ICON[id]}</div><div class="efs">${[...bn, ...e.moves.map(m => '🎴 ' + MOVES[m].name)].map(l => `<div class="ef">${l}</div>`).join('')}</div><div class="src">${i >= 0 ? 'Potenziamento · 1 slot' : '✔ Installato'}</div></div>`; };
  const slot = (x: string | null, f: (id: string, i: number) => string, i: number) => x ? f(x, i) : '<div class="soldx">Esaurita</div>';
  const go = `<button class="pri go" data-a="go" style="width:100%">⚔ Affronta arena ${r.arena}</button>`;
  const offer = (h: string, p: number) => `<div class="offer">${h}<div class="ptag">💰 ${p}</div></div>`;
  const rg = REGIONS[r.region ?? 'boxing'] ?? REGION_LIST[0], w = wins(r, rg.id), idx = w % CONFIG.matchesPerIsland, nme = rg.enemies[idx], pre = enemyFor(r.arena, rg.id, idx), boss = idx === CONFIG.matchesPerIsland - 1;
  const emv = rg.enemyMoves.map(id => ENEMY_MOVES.find(x => x.id === id)?.name).filter(Boolean).join(', ');
  const tale = (nme.story ?? `${esc(nme.name)} ti aspetta a ${rg.name}.`).replace(/\{nome\}/g, heroName()), chap = islandIndex(rg.id) * CONFIG.matchesPerIsland + idx + 1;
  // Personaggio a livelli: sagoma + un livello per ogni equipaggiamento installato (stessa tela, sovrapposti nell'ordine di data/game.json)
  if (layersSeen.run !== r) layersSeen = { run: r, ids: new Set(r.equipped) };
  const eqOrder = Object.keys(EQUIPMENT).filter(id => r.equipped.includes(id)), withArt = eqOrder.filter(id => layerImg(id)), noArt = eqOrder.filter(id => !layerImg(id)), aid = (r.hero?.avatar ?? 'a0').startsWith('data:') ? 'default' : r.hero?.avatar ?? 'a0';
  const figHtml = `<div class="hfig" title="${heroName()}"><div class="lyr body">${bodyImg(aid)}</div>${withArt.map(id => `<div class="lyr ${layersSeen.ids.has(id) ? '' : 'new'}" data-layer="${id}">${layerImg(id)}</div>`).join('')}${noArt.length ? `<div class="hmiss">${noArt.map(id => `<span title="${EQUIPMENT[id].name}">${ICON[id]}</span>`).join('')}</div>` : ''}<div class="hname">${heroName()}</div></div>`;
  r.equipped.forEach(id => layersSeen.ids.add(id));
  // Scelta di capitolo: finché non è fatta (e l'impostazione è attiva) si resta nella Storia, senza Store, Mazzo, Avanti o Mappa
  const pc = settings.story && !tutActive() ? pendingChoice(r) : null; if (pc) tab = 'sto';
  const nm = (t: string) => t.replace(/\{nome\}/g, heroName()), dn = r.chapters?.[chapterKey(r)], dev = dn && CHOICES.find(e => e.id === dn.ev), dopt = dev?.options.find(o => o.id === dn!.opt);
  const chHtml = pc ? `<div class="chbox"><div class="chap">✦ Una scelta ti attende</div><h3>${pc.ev.title}</h3><p class="tale">${nm(pc.ev.text)}</p><div class="chlist">${pc.options.map(o => `<button class="chopt" data-a="choose" data-id="${o.id}"><b>${o.label}</b><span class="chchips">${fxChips(r, scaledFx(r, o.fx))}</span></button>`).join('')}</div><small>Nessuna scelta è giusta o sbagliata: decidi per proseguire.</small></div>`
    : dev && dopt ? `<div class="chbox done"><div class="chap">✦ La tua scelta</div><b>${dev.title}</b> · ${dopt.label}<span class="chchips">${fxChips(r, dn!.fx ?? scaledFx(r, dopt.fx), dn!.gold)}</span><small>${dopt.text}</small></div>` : '';
  const storyHtml = `<div class="storywrap">${figHtml}<div class="story"><div class="sbook"><div class="chap">Capitolo ${chap} · ${rg.name} · ${STYLES.find(x => x.id === (r.style ?? 'boxing'))?.name}</div><h3>${boss ? '⚔ ' : ''}${esc(nme.name)}</h3><p class="tale">${tale}</p></div>${chHtml}
    <div class="sbox foe"><div class="sface">${foeArt(rg.id, rg.level, nme.id)}</div><div><b>${boss ? 'BOSS · ' : ''}${esc(nme.name)}</b><br><small>${rg.level} · partita ${idx + 1}/${CONFIG.matchesPerIsland} · ❤ ${pre.maxHp}</small><br><small>Mosse: ${emv}</small></div></div></div></div>`;
  const healRow = r.wounded ? `<div class="energyrow"><b>🩹 Ferite gravi: parti all'${Math.round(CONFIG.woundedStart * 100)}% dei PV</b><button class="ebtn" data-a="heal">Cura <span class="price">💰${CONFIG.healCost}</span></button></div>` : '';
  const back = (k: 'eq' | 'mv', p: number) => `<div class="offer"><div class="card back" data-drag="offer:${k}:2"><div class="bk">?<span class="pd"></span></div></div><div class="ptag mys">🎁 ${p}</div></div>`;
  const en = maxEnergy(r), energy = `<div class="energyrow"><b>⚡ ENERGIA ${en}/${CONFIG.maxEnergy}</b><div class="eticks">${Array.from({ length: CONFIG.maxEnergy }, (_, i) => `<div class="tick ${i < en ? 'fill' : ''}"></div>`).join('')}</div>${en >= CONFIG.maxEnergy ? '<small>✔ MAX</small>' : `<button class="ebtn" data-a="buyEn">+1 <span class="price">💰${energyPrice(r)}</span></button>`}</div>`;
  const store = `<div class="store"><div class="sl"><div class="og6">
    <div class="og"><small class="lbl">⚙ POTENZIAMENTI</small><div class="offers">${r.offers.eq.map((x, i) => i === 2 && x ? back('eq', r.offers.eqPrice) : slot(x, (id, j) => offer(eqCard(id, j), EQUIPMENT[id].price), i)).join('')}</div></div>
    <div class="og"><small class="lbl">✦ MOSSE</small><div class="offers">${r.offers.mv.map((x, i) => i === 2 && x ? back('mv', r.offers.mvPrice) : slot(x, (id, j) => offer(card('buy:' + id, { attr: `data-drag="offer:mv:${j}"` }), MOVES[id].price), i)).join('')}</div></div></div>
    <div class="eqline"><div class="eqleft"><div class="zone dz" data-zone="eqbar"><div class="eqwrap"><b>Equipaggiamento ${r.equipped.length}/${r.slots}</b><small> · ⬆ trascina qui un potenziamento</small><div class="eqrow">${r.equipped.map(id => eqCard(id, -1)).join('')}${Array.from({ length: Math.max(0, r.slots - r.equipped.length) }, () => '<div class="ph">slot libero</div>').join('')}</div></div></div>
    <div class="zone dz sellz" data-zone="sell"><div><b>💰 Vendita</b> <small>Trascina qui un equipaggiamento (50%)</small></div></div></div>
    <div class="zone dz deckz" data-zone="deck"><div class="card back"><div class="bk">${r.deck.length}<span class="pd"></span></div></div><b>Mazzo ${r.deck.length}/${CONFIG.maxDeck}</b><small>⬆ trascina qui una mossa</small></div></div>${energy}${healRow}</div></div>`;
  if (tab === 'me') {
    const inn = own.filter(c => r.deck.includes(c.uid)), out = own.filter(c => !r.deck.includes(c.uid));
    const cs = (l: typeof own) => l.map(c => card(c.uid, { attr: `data-drag="${c.uid}"`, sell: cardValue(r, c.uid) })).join('');
    body = `<div class="zone sellz" data-zone="sell"><b>🗑 Vendita</b> · trascina qui una carta per venderla (nel mazzo ne restano almeno ${CONFIG.minDeck})</div>
    <h3>Mazzo attivo ${inn.length}/${CONFIG.maxDeck}</h3><small>Trascina (o tocca) le carte tra le due aree.</small><div class="zone" data-zone="in"><div class="cards">${cs(inn)}</div></div>
    <h3>Fuori dal mazzo (${out.length})</h3><div class="zone" data-zone="out"><div class="cards">${cs(out)}</div></div>`;
  }
  app.innerHTML = `${head(r)}${r.msg ? `<div class="toast ok">${r.msg}</div>` : ''}${t}<div class="tabs three">${(['sto', 'st', 'me'] as const).map((k, i) => `<button class="${tab === k ? 'on' : ''}" data-a="tab" data-id="${k}" ${pc && k !== 'sto' ? 'disabled' : ''}>${['📖 Storia', '🛒 Store', '🎴 Mazzo'][i]}</button>`).join('')}</div><div class="pane">${tab === 'st' ? store : tab === 'sto' ? storyHtml : body}</div><div class="actbar">${tab === 'me' ? go : `<button class="pri go" data-a="next" ${pc ? 'disabled' : ''}>Avanti ➜</button>`}<button data-a="openmap" ${pc ? 'disabled' : ''}>🗺 Mappa</button></div>`;
  if (tab === 'st') { const en2 = maxEnergy(r); if (prevEn >= 0 && en2 > prevEn) { const tk = app.querySelectorAll<HTMLElement>('.tick')[en2 - 1]; if (tk) { tk.classList.add('gain'); const q = tk.getBoundingClientRect(); burst('combo', q.left + q.width / 2, q.top + q.height / 2); sfx('energy'); } } prevEn = en2; }
}
// ---- Slot machine per le carte misteriose: scorrono carte a caso, FERMA rallenta e atterra sulla carta sbloccata ----
const eqFace = (id: string) => { const e = EQUIPMENT[id], bn = [e.bonus.maxHp && `❤ +${e.bonus.maxHp} PV max`, e.bonus.dmg && `⚔️ +${e.bonus.dmg} danni`].filter(Boolean) as string[]; return `<div class="card eqc"><div class="nm">${e.name}</div><div class="art">${ICON[e.id]}</div><div class="efs">${[...bn, ...e.moves.map(m => '🎴 ' + MOVES[m].name)].map(l => `<div class="ef">${l}</div>`).join('')}</div><div class="src">Potenziamento</div></div>`; };
type L = (n: string, i: string) => string;
/** Racconto di come si ottiene una carta: dipende dalla natura dell'oggetto (un oggetto si trova o si costruisce, uno stile si impara, un potenziamento del corpo si risveglia...). */
const LORE_EQ: Record<string, L[]> = {
  gear: [(n, i) => `Tra i resti di un vecchio scontro a ${i} trovi ${n}.`, (n, i) => `Un mercante misterioso di ${i} ti cede ${n} senza dire una parola.`, (n, i) => `Con rottami raccolti a ${i} e l'aiuto di un fabbro riesci a costruirti ${n}.`, (n, i) => `Un veterano di ${i} ti consegna ${n}: «Ti servirà più di quanto pensi».`],
  implant: [(n, i) => `Un tecnico clandestino di ${i} ti installa ${n} dopo una notte di operazione.`, (n, i) => `Assembli ${n} da solo, pezzo per pezzo, con componenti recuperati a ${i}.`, (n, i) => `Un vecchio ingegnere di ${i} ti regala il prototipo di ${n}: «Provalo, se hai coraggio».`],
  body: [(n, i) => `Dopo giorni di allenamento estremo a ${i}, il tuo corpo si adatta: ${n} si risveglia in te.`, (n, i) => `Un anziano di ${i} ti insegna a respirare in un modo nuovo, e ${n} prende forma.`, (n, i) => `Una ferita quasi mortale a ${i} sveglia qualcosa dentro di te: ${n}.`],
  style: [(n, i) => `Un maestro di ${i} ti insegna ${n}, ripetendo i movimenti finché non diventano tuoi.`, (n, i) => `Dopo mille ore di sparring a ${i}, ${n} diventa il tuo stile.`, (n, i) => `Osservando un vecchio campione di ${i} capisci come funziona ${n}, e lo fai tuo.`],
  arcane: [(n, i) => `Tra le rovine di ${i} trovi ${n}, che pulsa di un potere antico.`, (n, i) => `Una figura incappucciata di ${i} ti offre ${n}: il prezzo, dice, lo scoprirai dopo.`, (n, i) => `Un luogo sacro di ${i} ti concede ${n}, come premio per aver resistito.`],
};
const LORE_MV: L[] = [(n, i) => `Osservando i combattenti di ${i} impari una nuova tecnica: «${n}».`, (n, i) => `Un maestro errante di ${i} ti mostra il segreto di «${n}», e tu lo fai tuo.`, (n, i) => `Dopo un duello a ${i}, il tuo corpo ricorda da solo «${n}».`, (n, i) => `Notti intere di pratica a ${i}: finalmente «${n}» ti riesce alla perfezione.`];
const STYLE_LORE: Record<string, string> = {
  boxing: 'Nel retro di una vecchia palestra, il suono dei sacchi ti ha insegnato il ritmo: guardia alta, pugni corti e tanta pazienza.',
  taekwondo: 'Anni in una scuola di quartiere ti hanno reso leggero: i tuoi calci arrivano prima che l\'avversario finisca di respirare.',
  jujitsu: 'Un vecchio maestro ti ha insegnato che la forza altrui si può usare: prese, proiezioni e leve sono il tuo linguaggio.',
};
function loreOf(kind: 'eq' | 'mv' | 'mercy', id: string) {
  if (kind === 'mercy') return id === 'ok' ? '«Vattene, finché puoi.» Il tuo avversario abbassa la guardia e ti lascia andare, ma prima ti alleggerisce la borsa: i tuoi soldi si dimezzano. Tornerai alla storia per riprovare il duello.' : '«Non ci sono scorciatoie.» Il tuo avversario scuote la testa e il duello continua: la tua supplica ti è costata il turno.';
  const rg = REGIONS[run?.region ?? 'boxing'] ?? REGION_LIST[0], name = kind === 'eq' ? EQUIPMENT[id].name : MOVES[id].name, k = kind === 'eq' ? LORE_EQ[EQUIPMENT[id].kind] ?? LORE_EQ.gear : LORE_MV;
  return k[(id.length + name.length) % k.length](name, rg.name);
}
/** Slot machine. Con `intro` (pietà) la slot parte ferma: "Gira" esegue l'azione e restituisce l'esito, "Annulla" chiude il riquadro senza conseguenze. */
function slotMachine(kind: 'eq' | 'mv' | 'mercy', id: string, intro?: () => string | null) {
  const pool = kind === 'eq' ? Object.keys(EQUIPMENT) : kind === 'mv' ? Object.values(MOVES).filter(m => m.price > 0).map(m => m.id) : ['ok', 'no'], face = (x: string) => kind === 'eq' ? eqFace(x) : kind === 'mv' ? card('buy:' + x) : `<div class="card mercy ${x}"><div class="nm">${x === 'ok' ? 'Risparmiato' : 'Nessuna pietà'}</div><div class="art">${x === 'ok' ? '🕊️' : '💀'}</div></div>`;
  const N = 10, fin = 6, base = Array.from({ length: N }, (_, i) => i === fin ? id : pool[(i * 7 + 3) % pool.length]);
  const ov = document.createElement('div'); ov.className = 'slotov';
  ov.innerHTML = `<div class="slotbox"><h2>${kind === 'mercy' ? (intro ? '🙏 Chiedere pietà?' : '🙏 Il destino decide…') : '🎰 Carta misteriosa'}</h2><div class="slotrow"><div class="reelwin"><div class="reel">${[0, 1, 2].map(() => base.map(x => `<div class="ritem">${intro ? '<div class="card back"><div class="bk">?</div></div>' : face(x)}</div>`).join('')).join('')}</div><div class="reelframe"></div></div><div class="slotlore"><h3>${kind === 'mercy' ? '📜 L\'esito' : '📜 Come l\'hai ottenuta'}</h3><p></p></div></div>${intro ? `<small class="mhint">Se vieni risparmiato perdi metà delle monete e rifai il duello; altrimenti perdi il turno. Si può chiedere una sola volta per duello.</small>` : ''}<div class="slbtns"><button class="pri" id="slb">${intro ? '🎰 Gira' : '⏹ FERMA'}</button>${intro ? '<button id="slc">✖ Annulla</button>' : ''}</div></div>`; document.body.appendChild(ov);
  const reel = ov.querySelector('.reel') as HTMLElement, win = ov.querySelector('.reelwin') as HTMLElement, btn = ov.querySelector('#slb') as HTMLButtonElement, title = ov.querySelector('h2') as HTMLElement;
  let y = 0, stopping = false, from = 0, to = 0, t0 = 0, last = performance.now(), lastIdx = -1;
  const finish = () => { const lore = ov.querySelector('.slotlore') as HTMLElement; (lore.querySelector('p') as HTMLElement).textContent = loreOf(kind, id); lore.classList.add('show'); title.textContent = kind === 'mercy' ? (id === 'ok' ? '🕊️ Sei stato risparmiato!' : '💀 Nessuna pietà!') : `✨ ${kind === 'eq' ? EQUIPMENT[id].name : MOVES[id].name} sbloccata!`; sfx(id === 'no' ? 'lose' : 'win'); const q = win.getBoundingClientRect(); burst('combo', q.left + q.width / 2, q.top + q.height / 2); btn.textContent = 'Continua'; btn.disabled = false; btn.onclick = () => { ov.remove(); afterReveal(kind, id); }; };
  const frame = (now: number) => {
    const H = win.clientHeight, T = N * H; if (!ov.isConnected) return;
    if (!stopping) y += 1600 * (now - last) / 1000; else { const p = Math.min(1, (now - t0) / 2600); y = from + (to - from) * (1 - (1 - p) ** 3); if (p >= 1) { reel.style.transform = `translateY(${-(to % T)}px)`; finish(); return; } }
    last = now; reel.style.transform = `translateY(${-(y % T)}px)`; const idx = Math.floor(y / H); if (idx !== lastIdx) { lastIdx = idx; sfx('click'); } requestAnimationFrame(frame);
  };
  const stop = () => { const H = win.clientHeight, T = N * H; stopping = true; from = y; to = y + ((fin * H - (y % T) + T) % T) + 2 * T; t0 = performance.now(); btn.disabled = true; };
  if (!intro) { btn.onclick = stop; requestAnimationFrame(frame); return; }
  mercyIdle = true; (ov.querySelector('#slc') as HTMLElement).onclick = () => { mercyIdle = false; ov.remove(); timerSync(); }; // annulla: si torna alla partita (il tempo non si è mai fermato)
  btn.onclick = () => { // gira: solo ora si decide l'esito (e si consuma la richiesta di pietà)
    mercyIdle = false; const res = intro(); if (res === null) { ov.remove(); return; } id = res;
    reel.querySelectorAll('.ritem').forEach((it, k) => { it.innerHTML = face(k % N === fin ? id : base[k % N]); }); // da carte coperte a facce vere, con l'esito già al posto giusto
    title.textContent = '🙏 Il destino decide…'; ov.querySelector('.mhint')?.remove(); ov.querySelector('#slc')?.remove(); btn.textContent = '⏹ FERMA'; btn.onclick = stop; last = performance.now(); requestAnimationFrame(frame);
  };
}
function afterReveal(kind: 'eq' | 'mv' | 'mercy', id: string) {
  if (kind === 'mercy') { render(); return; } // chiusa la slot machine: se non c'è slot si sceglie, altrimenti la carta vola al suo posto
  if (run?.pending) { choiceModal(); return; }
  flyTo(kind === 'eq' ? eqFace(id) : card('buy:' + id), kind === 'eq' ? '[data-zone="eqbar"]' : '[data-zone="deck"]');
}
function flyTo(html: string, sel: string) {
  const tgt = document.querySelector(sel) as HTMLElement | null; if (!tgt) return;
  const el = document.createElement('div'); el.className = 'flyc'; el.innerHTML = html; document.body.appendChild(el);
  const q = tgt.getBoundingClientRect(), dx = q.left + q.width / 2 - innerWidth / 2, dy = q.top + q.height / 2 - innerHeight / 2;
  const a = el.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.25)`, opacity: .9 }], { duration: 800, easing: 'cubic-bezier(.6,0,.4,1)' });
  a.onfinish = () => { el.remove(); burst('guard', q.left + q.width / 2, q.top + q.height / 2); sfx('fort'); };
}
function choiceModal() { // nessuno slot libero: sostituire un equipaggiamento (venduto al 50%) oppure scartare la nuova carta (+50% del suo valore)
  const p = run?.pending; if (!p || document.querySelector('.slotov')) return;
  const ov = document.createElement('div'); ov.className = 'slotov choiceov';
  ov.innerHTML = `<div class="slotbox"><h2>Nessuno slot libero</h2><div class="chrow">${eqFace(p.id)}<div class="chopts"><small>Sostituisci un equipaggiamento (venduto al 50%) oppure scarta la nuova carta:</small>${run!.equipped.map(e => `<button data-rep="${e}">${ICON[e]} ${EQUIPMENT[e].name} <span class="price">+💰${Math.floor(run!.paid[e] * CONFIG.sellRatio)}</span></button>`).join('')}<button class="pri" data-dis="1">🗑 Scarta · +💰${Math.floor(EQUIPMENT[p.id].price * CONFIG.sellRatio)}</button></div></div></div>`; document.body.appendChild(ov);
  ov.onclick = ev => {
    const b = (ev.target as HTMLElement).closest('button') as HTMLElement | null; if (!b || !run) return; const g0 = run.gold, id = p.id;
    const err = b.dataset.rep ? resolvePending(run, 'replace', b.dataset.rep) : resolvePending(run, 'discard'); if (err) { note = err; render(); return; }
    ov.remove(); persist(run); if (run.gold !== g0 && !settings.god) coinFx(g0, run.gold); render(); if (b.dataset.rep) flyTo(eqFace(id), '[data-zone="eqbar"]');
  };
}
const GOD = 9999999;
const UIA = ['story', 'pile', 'closePile', 'god', 'sail', 'timer', 'tmode', 'theme', 'skipvs', 'set', 'closeSet', 'speed', 'calm', 'music', 'sfx', 'menu', 'abandon'];
/** Animazione al centro dello schermo: l'oro scende (o sale) dal valore precedente a quello nuovo. */
function coinFx(a: number, b: number) {
  const d = document.createElement('div'), diff = b - a; d.className = 'coinfx'; d.innerHTML = `<div class="cf-n">💰 <span>${a}</span></div><div class="cf-d ${diff < 0 ? 'neg' : 'pos'}">${diff > 0 ? '+' : ''}${diff}</div>`; document.body.appendChild(d); sfx('coin');
  const sp = d.querySelector('span')!, t0 = performance.now(); const step = (t: number) => { const p = Math.min(1, (t - t0 - 250) / 700); sp.textContent = String(Math.round(a + diff * Math.max(0, p))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  setTimeout(() => d.remove(), 1700);
}
const AUD = [['music', 'mv', '🎵', '🔇', 'Musica'], ['sfx', 'sv', '🔊', '🔈', 'Effetti sonori']] as const;
const modal = () => `<div class="modal"><div class="mbox"><h2>⚙ Impostazioni</h2><b>Velocità animazioni</b><div class="seg">${LABELS.map((l, i) => `<button class="${settings.speed === i ? 'on' : ''}" data-a="speed" data-id="${i}">${l}</button>`).join('')}</div><button class="${settings.calm ? 'on' : ''}" data-a="calm">${settings.calm ? '☑' : '☐'} Riduci animazioni</button>${AUD.map(([k, v, on, off, l]) => `<div class="arow ${settings[k] ? '' : 'off'}"><button class="tgl ${settings[k] ? 'on' : ''}" data-a="${k}" title="${l}">${settings[k] ? on : off}</button><label class="vol"><span>${l} <b class="vv">${Math.round(settings[v] * 100)}%</b></span><input type="range" min="0" max="100" value="${Math.round(settings[v] * 100)}" style="--v:${Math.round(settings[v] * 100)}%" data-vol="${v}"></label></div>`).join('')}<button class="${settings.god ? 'on' : ''}" data-a="god">🛠 God mode: ${settings.god ? 'ON' : 'OFF'}</button><button class="${settings.story ? 'on' : ''}" data-a="story">${settings.story ? '☑' : '☐'} Scelte di capitolo (Storia)</button><button class="${settings.timer ? 'on' : ''}" data-a="timer">${settings.timer ? '⏱' : '⏸'} Timer di turno</button><div class="seg3">${['Veloce · 10s', 'Standard · 30s', 'Lento · 1 min'].map((l, i) => `<button class="${settings.tmode === i ? 'on' : ''}" data-a="tmode" data-id="${i}" ${settings.timer ? '' : 'disabled'}>${l}</button>`).join('')}</div>${started && run ? `<button data-a="menu">🏠 Torna al menu principale</button><button data-a="abandon">${sure ? '⚠ Tocca ancora per confermare' : '🗑 Abbandona la run'}</button>` : ''}<button class="pri" data-a="closeSet">Chiudi</button><small>La run viene salvata automaticamente: dal menu puoi riprenderla.</small></div></div>`;
function pileModal() { // mazzo (ordine nascosto) o scarti (carte già giocate), raggruppati per carta
  const c = run!.combat!, d = pileView === 'draw', src = d ? c.draw : c.discard, g = new Map<string, { uid: string; n: number }>();
  src.forEach(u => { const k = moveOf(u), e = g.get(k); if (e) e.n++; else g.set(k, { uid: u, n: 1 }); });
  const list = [...g.values()].sort((x, y) => MOVES[moveOf(x.uid)].name.localeCompare(MOVES[moveOf(y.uid)].name));
  return `<div class="modal pilem"><div class="mbox pilebox"><h2>${d ? '🂠 Carte rimaste nel mazzo' : '🗑 Carte già giocate'} (${src.length})</h2><small>${d ? 'Ordine di pesca nascosto: sono elencate per nome.' : `Quando il mazzo finisce, ${CONFIG.discardDrawCost}⚡ le rimescolano nel mazzo e pescano 1 carta.`}</small>${list.length ? `<div class="cards pilecards">${list.map(x => card(x.uid, { badge: x.n > 1 ? '×' + x.n : '' })).join('')}</div>` : `<p class="pileempty">${d ? 'Il mazzo è vuoto.' : 'Nessuna carta negli scarti.'}</p>`}<button class="pri" data-a="closePile">Chiudi</button></div></div>`;
}
function ui(a: string, id: string) {
  if (a === 'pile') pileView = id as typeof pileView; else if (a === 'closePile') pileView = null;
  else if (a === 'set') settingsOpen = true; else if (a === 'closeSet') { settingsOpen = false; sure = false; }
  else if (a === 'story') settings.story = !settings.story;
  else if (a === 'speed') settings.speed = +id; else if (a === 'theme') settings.theme = id; else if (a === 'timer') { settings.timer = !settings.timer; tTurn = -1; } else if (a === 'tmode') { settings.tmode = +id; tTurn = -1; } else if (a === 'skipvs') vs = null; else if (a === 'god') { settings.god = !settings.god; if (!settings.god && run) { run.god = false; run.gold = 100; } } else if (a === 'sail') { sail(); return; } else if (a === 'calm') settings.calm = !settings.calm; else if (a === 'music' || a === 'sfx') { settings[a] = !settings[a]; audioCfg(settings.music, settings.sfx, settings.mv, settings.sv); }
  else if (a === 'menu') { if (run?.phase === 'over') { run = null; clearRun(localStorage); } started = false; settingsOpen = false; sure = false; }
  else if (a === 'abandon') { if (!sure) sure = true; else { run = null; clearRun(localStorage); started = false; settingsOpen = false; sure = false; } }
  try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch { /* ignora */ }
  render();
}
function act(a: string, id = '') {
  if (sailing) return;
  if (UIA.includes(a)) { ui(a, id); return; }
  let err: Err = null; note = '';
  if (a === 'new') { creating = true; draft = { name: run?.hero?.name ?? '', av: run?.hero?.avatar ?? 'a0', style: run?.style ?? 'boxing' }; }
  else if (a === 'startrun') { run = newRun(); run.hero = { name: draft.name.trim() || 'Protagonista', avatar: draft.av }; setStyle(run, draft.style); started = true; tab = 'sto'; mapSel = null; creating = false; }
  else if (a === 'avatar') draft.av = id; else if (a === 'style') draft.style = id; else if (a === 'cancelnew') creating = false; else if (a === 'cont') started = true; else if (a === 'tutorial') startTutorial();
  else if (run) {
    const mys = a === 'offerEq' && +id === 2 ? run.offers.eq[2] : a === 'offerMv' && +id === 2 ? run.offers.mv[2] : null, g0 = run.gold, e0 = run.combat?.enemy.hp ?? 0, p0 = run.hp;
    if (settings.story && !tutActive() && pendingChoice(run) && (a === 'next' || a === 'openmap' || a === 'go' || (a === 'tab' && id !== 'sto'))) err = 'Prima fai la tua scelta nella Storia.';
    else if (a === 'choose') { err = makeChoice(run, id); if (!err) sfx('energy'); }
    else if (a === 'tab') tab = id as typeof tab; else if (a === 'next') tab = tab === 'sto' ? 'st' : 'me'; else if (a === 'region') { if (unlocked(run).includes(id)) mapSel = id; else err = '🔒 Isola bloccata: vinci le 5 partite dell\'isola precedente.'; } else if (a === 'openmap') err = openMap(run);
    else if (a === 'mercy') { const c = run.combat; if (c?.mercy) err = 'Hai già chiesto pietà in questo duello.'; else if (c?.phase !== 'player') err = 'Non è il tuo turno.'; else slotMachine('mercy', '', () => { const res = askMercy(run!); if (res.err) { note = res.err; render(); return null; } persist(run!); return res.spared ? 'ok' : 'no'; }); } else if (a === 'sellcard') err = sellCard(run, id); else if (a === 'heal') err = healRun(run); else if (a === 'ddraw') { err = drawDiscard(run); if (!err) sfx('shuffle'); } else if (a === 'enter') { err = chooseRegion(run, mapSel ?? ''); if (!err) { tab = 'sto'; mapSel = null; } } else if (a === 'buyE') err = buyEquipment(run, id); else if (a === 'sellE') err = sellEquipment(run, id);
    else if (a === 'buyM') err = buyMove(run, id); else if (a === 'buyEn') err = buyEnergy(run); else if (a === 'offerEq') err = buyOfferEq(run, +id); else if (a === 'offerMv') err = buyOfferMv(run, +id); else if (a === 'hint') err = id; else if (a === 'sellM') err = sellMove(run, id); else if (a === 'deck') err = toggleDeck(run, id);
    else if (a === 'go') err = beginArena(run); else if (a === 'play') err = playCard(run, id); else if (a === 'end') err = endTurn(run);
    if (!['tab', 'next', 'play', 'end'].includes(a)) run.msg = '';
    if (!err) { if (a === 'end') sfx('turn'); if (run.gold !== g0 && !settings.god) coinFx(g0, run.gold); if (mys) slotMachine(a === 'offerEq' ? 'eq' : 'mv', mys);
      if (a === 'go') { const en = run.combat!.enemy, o = { tier: en.tier, art: en.art, id: en.id, name: en.name, hp: en.maxHp, lv: run.arena }; vs = o; sfx('hit'); setTimeout(() => { if (vs === o) { vs = null; render(); } }, 2600); } }
  }
  note = err ?? ''; if (run) persist(run); if (tutActive()) tutPatchCombat(); render();
}
app.addEventListener('click', ev => { const b = (ev.target as HTMLElement).closest('button[data-a], g[data-a], .pile[data-a]') as HTMLButtonElement | null; if (b && !b.disabled) { sfx('click'); act(b.dataset.a!, b.dataset.id); } else if ((ev.target as HTMLElement).classList.contains('pilem')) act('closePile'); });
// ---- Drag & drop (pointer events: mouse + touch) ----
let el: HTMLElement | null = null, sx = 0, sy = 0, moved = false, ph: HTMLElement | null = null;
/** Durante il trascinamento la carta passa a position:fixed (con segnaposto): non viene più tagliata dai contenitori con overflow. */
function lift(c: HTMLElement) { const q = c.getBoundingClientRect(); ph = document.createElement('div'); ph.style.cssText = `width:${q.width}px;height:${q.height}px;flex:none;margin:${getComputedStyle(c).margin}`; c.before(ph); Object.assign(c.style, { position: 'fixed', left: q.left + 'px', top: q.top + 'px', width: q.width + 'px', height: q.height + 'px', margin: '0', zIndex: '300' }); }
function markTarget(c: HTMLElement) { const u = c.dataset.drag ?? ''; if (u.startsWith('offer:')) document.querySelector(`[data-zone="${u.split(':')[1] === 'eq' ? 'eqbar' : 'deck'}"]`)?.classList.add('target'); } // evidenzia dove trascinare la carta da acquistare
function clearTargets() { document.querySelectorAll('.target').forEach(z => z.classList.remove('target')); }
function unlift(c: HTMLElement) { ph?.remove(); ph = null; ['position', 'left', 'top', 'width', 'height', 'margin', 'z-index'].forEach(p => c.style.removeProperty(p)); }
const zoneAt = (ev: PointerEvent) => document.elementsFromPoint(ev.clientX, ev.clientY).filter(n => !(el && el.contains(n)) && n !== ph).map(e => e.closest('[data-zone]')).find(Boolean) as HTMLElement | undefined;
const clearHot = () => document.querySelectorAll('.hot').forEach(z => z.classList.remove('hot'));
app.addEventListener('pointerdown', ev => { const c = (ev.target as HTMLElement).closest('[data-drag]') as HTMLElement | null; if (!c) return; el = c; sx = ev.clientX; sy = ev.clientY; moved = false; c.setPointerCapture(ev.pointerId); });
app.addEventListener('pointermove', ev => {
  if (!el) return; const dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.hypot(dx, dy) < 8) return;
  if (!moved) { lift(el); markTarget(el); } moved = true; el.classList.add('drag'); el.style.transform = `translate(${dx}px,${dy}px) scale(1.15)`; clearHot(); zoneAt(ev)?.classList.add('hot');
});
const endDrag = (ev: PointerEvent, cancel: boolean) => {
  if (!el) return; const c = el, uid = c.dataset.drag!, z = cancel ? undefined : zoneAt(ev)?.dataset.zone; el = null; clearHot();
  c.classList.remove('drag'); c.style.transform = ''; unlift(c); clearTargets(); if (!run) return;
  if (uid.startsWith('offer:')) { // acquisto solo con drag & drop: potenziamenti -> barra equipaggiamenti, mosse -> mazzo
    const [, k, i] = uid.split(':'); if (z === (k === 'eq' ? 'eqbar' : 'deck')) act(k === 'eq' ? 'offerEq' : 'offerMv', i);
    else if (!cancel) act('hint', k === 'eq' ? 'Trascina il potenziamento sulla barra equipaggiamenti.' : 'Trascina la mossa sul mazzo.'); return;
  }
  if (uid.startsWith('eqs:')) { if (z === 'sell') act('sellE', uid.slice(4)); else if (moved && !cancel) act('hint', 'Trascina la carta sulla zona vendita per venderla.'); return; } // vendita equipaggiamento
  if (z === 'sell' && run.phase === 'store') { act('sellcard', uid); return; }
  const inDeck = run.deck.includes(uid);
  if (!moved && !cancel) { act(run.phase === 'combat' ? 'play' : 'deck', uid); return; } // tap = scorciatoia
  if (z === 'field' && run.phase === 'combat') act('play', uid);
  else if ((z === 'in' && !inDeck) || (z === 'out' && inDeck)) act('deck', uid);
};
app.addEventListener('pointerup', ev => endDrag(ev, false)); app.addEventListener('pointercancel', ev => endDrag(ev, true));
// ---- Scheda estesa dell'equipaggiamento (hover con il mouse, tocco su touch) ----
const tip = document.createElement('div'); tip.id = 'tip'; document.body.appendChild(tip);
const mvLine = (m: string) => { const x = MOVES[m]; return `<div class="tm"><b>${x.name}</b> <span class="tc">⚡${x.cost}</span><br><small>${effectLines(x.effect).join(' · ')}</small></div>`; };
const eqFull = (id: string) => { const e = EQUIPMENT[id], bn = [e.bonus.maxHp && `❤ +${e.bonus.maxHp} PV max`, e.bonus.dmg && `⚔️ +${e.bonus.dmg} danni a ogni attacco`].filter(Boolean).join('<br>');
  return `<div class="th">${ICON[id]} <b>${e.name}</b></div><small>${e.desc}</small>${bn ? `<div class="tm">${bn}</div>` : ''}<div class="tl">MOSSE SBLOCCATE</div>${e.moves.map(mvLine).join('')}<div class="tl">MOSSA AVANZATA</div>${e.advanced.map(mvLine).join('')}<div class="tl">PREZZO BASE 💰${e.price}</div>`; };
function showTip(el: HTMLElement) {
  tip.innerHTML = eqFull(el.dataset.eq!); tip.style.display = 'block';
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, x = r.left < innerWidth / 2 ? r.right + 8 : r.left - w - 8;
  tip.style.left = Math.max(4, Math.min(innerWidth - w - 4, x)) + 'px'; tip.style.top = Math.max(4, Math.min(innerHeight - h - 4, r.top - 10)) + 'px';
}
const hideTip = () => { tip.style.display = 'none'; };
app.addEventListener('mouseover', ev => { const el = (ev.target as HTMLElement).closest('[data-eq]') as HTMLElement | null; if (el) showTip(el); else hideTip(); });
app.addEventListener('mouseleave', hideTip);
app.addEventListener('mouseover', ev => { // suono al passaggio del cursore su una carta della mano
  const c = (ev.target as HTMLElement).closest('.hand .card') as HTMLElement | null; if (!c || c.contains(ev.relatedTarget as Node | null) || el || c.classList.contains('off')) return; sfx('hover');
});
app.addEventListener('click', ev => { const el = (ev.target as HTMLElement).closest('[data-eq]') as HTMLElement | null; if (el) showTip(el); else hideTip(); });
app.addEventListener('input', ev => { // cursori volume
  const el = ev.target as HTMLInputElement, k = el.dataset.vol as 'mv' | 'sv' | undefined; if (el.id === 'nm') { draft.name = el.value; const np = app.querySelector('.nameplate.big'); if (np) np.textContent = el.value || 'Protagonista'; return; }
  if (!k) return; settings[k] = +el.value / 100; el.style.setProperty('--v', el.value + '%'); const vv = el.closest('.vol')?.querySelector('.vv'); if (vv) vv.textContent = el.value + '%';
  audioCfg(settings.music, settings.sfx, settings.mv, settings.sv); try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch { /* ignora */ } if (k === 'sv') sfx('click');
});
app.addEventListener('change', ev => { // foto profilo caricata: ritagliata e ridotta a 128x128
  const t = ev.target as HTMLInputElement, f = t.files?.[0]; if (t.id !== 'photo' || !f) return; const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 128; const s = Math.min(img.width, img.height); c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128); draft.av = c.toDataURL('image/jpeg', 0.8); URL.revokeObjectURL(url); render(); }; img.src = url;
});
addEventListener('keydown', ev => { if (run?.phase !== 'combat' || !started || settingsOpen || pileView) return; if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); act('end'); } const u = run.combat?.hand[+ev.key - 1]; if (u) act('play', u); });
render();
