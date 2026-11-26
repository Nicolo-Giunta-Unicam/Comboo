// Audio procedurale (WebAudio): nessun file esterno. Musica composta a mano e suonata da strumenti sintetizzati + effetti sonori.
//
// MUSICA: due temi in Re minore, che si alternano secondo la situazione (setMode):
//  • calm   (store, storia, mappa): tema d'avventura a 88 BPM. Arpa pizzicata, melodia di 8 battute che torna (con il flauto al secondo giro), pad caldo, basso e tamburo a cornice leggero.
//  • combat (duello): marcia da battaglia a 128 BPM. Tom/taiko, rullante, basso a crome, accordi staccati, crash a ogni frase, riser prima del cambio e melodia eroica dalla terza battuta.
// Per cambiare il carattere basta toccare le tabelle sotto (accordi *_CH, melodie *_MEL, BPM) e i volumi (ultimo argomento di ogni strumento).
type Mode = 'calm' | 'combat';
let ctx: AudioContext | null = null, master: GainNode, mbus: GainNode, sbus: GainNode, mvol = 1, svol = 1, musicOn = true, sfxOn = true, mode: Mode = 'calm', timer = 0, bar = 0, unlocked = false, seed = 7, seg: GainNode | null = null, nextT = 0, lastMode: Mode | null = null;
const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
/** Riverbero "a sala": rumore con coda che si spegne in modo morbido. */
function hall(c: BaseAudioContext, secs: number) { const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const a = b.getChannelData(ch); for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3.2; } return b; }
/** Catena della musica: volume → compressore leggero (gli strati non si sommano fino a distorcere) → uscita, più un riverbero in parallelo. Usata dal gioco e dal render di prova. */
export function buildMusicBus(c: BaseAudioContext, dest: AudioNode, vol: number): GainNode {
  const bus = c.createGain(), comp = c.createDynamicsCompressor(), rv = c.createConvolver(), rs = c.createGain(); bus.gain.value = vol;
  comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = .006; comp.release.value = .22; bus.connect(comp); comp.connect(dest);
  rv.buffer = hall(c, 2.4); rs.gain.value = .28; bus.connect(rs); rs.connect(rv); rv.connect(dest); return bus;
}
function ensure() { if (!AC) return null; if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    sbus = ctx.createGain(); sbus.gain.value = svol; sbus.connect(master); mbus = buildMusicBus(ctx, master, musicOn ? .8 * mvol : 0); } if (ctx.state === 'suspended') void ctx.resume(); return ctx; }
function tone(f: number, t: number, d: number, type: OscillatorType, v: number, f2?: number) {
  const c = ctx!, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(sbus); o.start(t); o.stop(t + d + 0.05);
}
function noise(t: number, d: number, v: number, f: number) {
  const c = ctx!, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl); fl.connect(g); g.connect(sbus); s.start(t);
}
export function sfx(n: string) {
  if (!sfxOn || !ensure()) return; const t = ctx!.currentTime;
  switch (n) {
    case 'click': tone(700, t, .05, 'square', .05); break; case 'draw': noise(t, .14, .3, 2500); break;
    case 'deal': noise(t, .09, .35, 4200); noise(t + .03, .07, .2, 1800); tone(1250, t, .05, 'triangle', .05, 700); break;
    case 'warn': tone(440, t, .13, 'square', .07, 330); tone(330, t + .15, .22, 'square', .07, 220); break;
    case 'hover': tone(1500, t, .035, 'sine', .035, 1900); noise(t, .025, .06, 5000); break;
    case 'shuffle': for (let i = 0; i < 5; i++) { noise(t + i * .05, .06, .25, 3000 + i * 300); tone(900 + i * 80, t + i * .05, .04, 'triangle', .04); } break;
    case 'place': tone(200, t, .12, 'triangle', .3, 90); noise(t, .06, .2, 800); break;
    case 'hit': noise(t, .2, .5, 500); tone(160, t, .18, 'sawtooth', .25, 50); break;
    case 'shield': tone(1000, t, .12, 'square', .08, 600); noise(t, .08, .2, 3500); break;
    case 'coin': tone(988, t, .08, 'square', .07); tone(1319, t + .08, .18, 'square', .07); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .12, .25, 'triangle', .15)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * .2, .35, 'sawtooth', .1)); break;
    case 'fort': [392, 523, 659].forEach((f, i) => tone(f, t + i * .05, .25, 'sine', .12)); break; case 'combo': [659, 784, 988, 1319].forEach((f, i) => tone(f, t + i * .07, .22, 'sine', .1)); break;
    case 'energy': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .05, .2, 'sine', .1)); break;
    case 'firework': noise(t, .3, .35, 2800); tone(900, t, .3, 'sine', .08, 200); break;
    case 'turn': tone(440, t, .1, 'sine', .15); tone(660, t + .1, .15, 'sine', .15); break;
  }
}

// ---- strumenti (ogni funzione riceve il bus: contesto + nodo di uscita) ----
export interface Bus { c: BaseAudioContext; d: AudioNode }
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12), rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, hu = () => (rnd() - .5) * .016; // hu = piccola imprecisione "umana" nei tempi
const noiseBufs = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseOf(c: BaseAudioContext) { let b = noiseBufs.get(c); if (!b) { b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; noiseBufs.set(c, b); } return b; }
/** Soffio di rumore filtrato con decadimento esponenziale (rullante, piatti, shaker). */
function puff(B: Bus, t: number, d: number, v: number, type: BiquadFilterType, f: number, q = 1) {
  const c = B.c, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseOf(c); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl); fl.connect(g); g.connect(B.d); s.start(t, Math.random() * 1.5, d + .05);
}
/** Tamburo grave (taiko/tom): sinusoide che scende di tono + colpo di pelle. */
function thump(B: Bus, t: number, v: number, f0 = 115, f1 = 42, d = .3) {
  const c = B.c, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d * .6);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(B.d); o.start(t); o.stop(t + d + .05); puff(B, t, .04, v * .45, 'lowpass', 900);
}
const slap = (B: Bus, t: number, v: number) => { puff(B, t, .11, v, 'bandpass', 1700, .8); puff(B, t, .06, v * .5, 'highpass', 4000); };
const hat = (B: Bus, t: number, v: number) => puff(B, t, .035, v, 'highpass', 7500);
const crash = (B: Bus, t: number, v: number) => puff(B, t, 1.5, v, 'highpass', 5500);
/** Crescendo di rumore che sale di frequenza: annuncia il cambio di frase. */
function riser(B: Bus, t: number, d: number, v: number) {
  const c = B.c, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseOf(c); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(7000, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + d * .96); g.gain.linearRampToValueAtTime(.0001, t + d); s.connect(f); f.connect(g); g.connect(B.d); s.start(t, Math.random() * 1.5, d + .05);
}
/** Corda pizzicata (arpa/liuto): triangolo + dente di sega, filtro che si chiude in fretta. */
function pluck(B: Bus, m: number, t: number, d: number, v: number) {
  const c = B.c, f0 = mtof(m), o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f0; o2.frequency.value = f0; o2.detune.value = 6; g2.gain.value = .3; f.type = 'lowpass'; f.Q.value = .7;
  f.frequency.setValueAtTime(Math.min(6500, f0 * 8), t); f.frequency.exponentialRampToValueAtTime(Math.max(500, f0 * 1.6), t + d * .8);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(B.d);
  o.start(t); o2.start(t); o.stop(t + d + .05); o2.stop(t + d + .05);
}
/** Vibrato lento (cent) per le voci sostenute. */
function vib(c: BaseAudioContext, t: number, d: number, cents: number, targets: AudioParam[]) { const l = c.createOscillator(), g = c.createGain(); l.frequency.value = 5.3; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(cents, t + .25); l.connect(g); targets.forEach(p => g.connect(p)); l.start(t); l.stop(t + d + .05); }
/** Flauto: sinusoide + ottava, attacco morbido e vibrato. */
function flute(B: Bus, m: number, t: number, d: number, v: number) {
  const c = B.c, o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), g = c.createGain(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 2; g2.gain.value = .22;
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .06); g.gain.setValueAtTime(v * .85, t + d * .7); g.gain.exponentialRampToValueAtTime(.0001, t + d + .08); o.connect(g); o2.connect(g2); g2.connect(g); g.connect(B.d);
  vib(c, t, d, 9, [o.detune, o2.detune]); o.start(t); o2.start(t); o.stop(t + d + .15); o2.stop(t + d + .15);
}
/** Pad: accordo sostenuto di denti di sega scordati, filtrato, attacco lento. */
function pad(B: Bus, ms: number[], t: number, d: number, v: number, cut = 900) {
  const c = B.c, g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + d * .35); g.gain.linearRampToValueAtTime(.0001, t + d); f.connect(g); g.connect(B.d);
  for (const m of ms) for (const dt of [-7, 7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + d + .05); }
}
/** Basso: triangolo morbido (calm) o dente di sega con filtro che si chiude (combat). */
function bassNote(B: Bus, m: number, t: number, d: number, v: number, saw = false) {
  const c = B.c, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); o.type = saw ? 'sawtooth' : 'triangle'; o.frequency.value = mtof(m); f.type = 'lowpass';
  f.frequency.setValueAtTime(saw ? 900 : 500, t); f.frequency.exponentialRampToValueAtTime(saw ? 220 : 300, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(f); f.connect(g); g.connect(B.d); o.start(t); o.stop(t + d + .05);
}
/** Accordo staccato (ottoni/archi corti). */
function stab(B: Bus, ms: number[], t: number, d: number, v: number) {
  const c = B.c, g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(700, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); f.connect(g); g.connect(B.d);
  for (const m of ms) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.connect(f); o.start(t); o.stop(t + d + .05); }
}
/** Voce solista del duello: dente di sega + quadra scordate, filtro mordente, vibrato. */
function lead(B: Bus, m: number, t: number, d: number, v: number) {
  const c = B.c, o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m); o2.detune.value = 8; g2.gain.value = .5;
  f.type = 'lowpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(3400, t); f.frequency.exponentialRampToValueAtTime(1500, t + d); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.setValueAtTime(v * .8, t + d * .75); g.gain.exponentialRampToValueAtTime(.0001, t + d + .06);
  o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(B.d); vib(c, t, d, 14, [o.detune, o2.detune]); o.start(t); o2.start(t); o.stop(t + d + .12); o2.stop(t + d + .12);
}

// ---- composizione ----
const BPM: Record<Mode, number> = { calm: 88, combat: 128 };
/** Accordi del tema calm (8 battute): r = nota del basso, v = voci dell'arpeggio. Dm · Si♭ · Fa · Do · Dm · Sol m · Si♭ · La (cadenza che riporta a Re minore). */
const CALM_CH = [{ r: 38, v: [50, 57, 62, 65] }, { r: 34, v: [53, 58, 62, 65] }, { r: 41, v: [53, 57, 60, 65] }, { r: 36, v: [52, 55, 60, 64] }, { r: 38, v: [50, 57, 62, 65] }, { r: 43, v: [50, 55, 58, 62] }, { r: 34, v: [53, 58, 62, 65] }, { r: 45, v: [52, 57, 61, 64] }];
/** Melodie: per ogni battuta [croma d'inizio (0-7), nota MIDI, durata in crome]. */
const CALM_MEL: [number, number, number][][] = [
  [[0, 69, 3], [3, 74, 1], [4, 77, 2], [6, 76, 1], [7, 74, 1]], [[0, 74, 2], [2, 70, 2], [4, 72, 1], [5, 74, 1], [6, 77, 2]], [[0, 77, 3], [3, 76, 1], [4, 72, 2], [6, 69, 2]], [[0, 67, 2], [2, 72, 2], [4, 76, 3], [7, 74, 1]],
  [[0, 74, 2], [2, 77, 2], [4, 81, 3], [7, 79, 1]], [[0, 77, 2], [2, 74, 2], [4, 70, 2], [6, 72, 1], [7, 74, 1]], [[0, 77, 2], [2, 74, 2], [4, 70, 2], [6, 74, 2]], [[0, 73, 2], [2, 76, 2], [4, 81, 2], [6, 76, 2]],
];
/** Tema combat: Dm · Dm · Si♭ · Do · Dm · Dm · Sol m · La. s = accordo staccato. */
const CB_CH = [{ r: 38, s: [57, 62, 65] }, { r: 38, s: [57, 62, 65] }, { r: 34, s: [58, 62, 65] }, { r: 36, s: [55, 60, 64] }, { r: 38, s: [57, 62, 65] }, { r: 38, s: [57, 62, 65] }, { r: 43, s: [55, 58, 62] }, { r: 45, s: [57, 61, 64] }];
const CB_MEL: [number, number, number][][] = [
  [[0, 74, 2], [2, 74, 1], [3, 77, 1], [4, 81, 2], [6, 79, 1], [7, 77, 1]], [[0, 76, 2], [2, 74, 2], [4, 69, 4]], [[0, 74, 2], [2, 74, 1], [3, 77, 1], [4, 82, 2], [6, 81, 1], [7, 77, 1]], [[0, 79, 2], [2, 76, 2], [4, 72, 4]],
  [[0, 77, 2], [2, 77, 1], [3, 81, 1], [4, 86, 2], [6, 84, 1], [7, 81, 1]], [[0, 83, 2], [2, 81, 2], [4, 77, 2], [6, 74, 2]], [[0, 82, 2], [2, 79, 2], [4, 74, 2], [6, 70, 2]], [[0, 73, 1], [1, 76, 1], [2, 79, 2], [4, 76, 2], [6, 73, 2]],
];
function calmBar(B: Bus, b: number, t: number): number {
  const beat = 60 / BPM.calm, e = beat / 2, k = b % 8, sec = Math.floor(b / 8) % 2, ch = CALM_CH[k];
  pad(B, [ch.v[0], ch.v[1], ch.v[3]], t, beat * 4.2, .02);
  bassNote(B, ch.r, t, beat * 1.8, .12); bassNote(B, ch.r + 7, t + beat * 2, beat * 1.5, .08);
  [0, 1, 2, 3, 2, 1, 2, 3].forEach((i, s) => pluck(B, ch.v[i], t + s * e + hu(), beat * 1.4, .028)); // arpeggio dell'accordo
  for (const [s, n, d] of CALM_MEL[k]) { const at = t + s * e + hu(); pluck(B, n, at, Math.max(.35, d * e * 1.5), .065); if (sec === 1) flute(B, n, at, d * e * 1.05, .045); } // al secondo giro la melodia è raddoppiata dal flauto
  if (k >= 2 || sec === 1) { thump(B, t, .17, 100, 50, .35); thump(B, t + beat * 2, .1, 100, 50, .3); for (const s of [1, 3, 5, 7]) hat(B, t + s * e, .012); if (sec === 1) { slap(B, t + beat, .03); slap(B, t + beat * 3, .03); } }
  return beat * 4;
}
function combatBar(B: Bus, b: number, t: number): number {
  const beat = 60 / BPM.combat, q = beat / 4, e = beat / 2, k = b % 8, ch = CB_CH[k], fill = k % 4 === 3;
  pad(B, [ch.r + 12, ch.r + 19], t, beat * 4.2, .016, 700);
  [0, 0, 12, 0, 0, 0, 12, 7].forEach((o, s) => bassNote(B, ch.r + o, t + s * e, e * .85, .075, true)); // ostinato di crome
  for (const [s, v] of [[0, .3], [6, .2], [8, .28], [14, .2]]) if (!(fill && s >= 12)) thump(B, t + s * q, v);
  slap(B, t + 4 * q, .13); if (!fill) slap(B, t + 12 * q, .13); else [12, 13, 14, 15].forEach((s, i) => thump(B, t + s * q, .16 - i * .01, 240 - i * 30, 110 - i * 10, .2)); // ogni 4 battute un rullo di tom
  for (let s = 0; s < 16; s += 2) hat(B, t + s * q, s % 4 === 2 ? .016 : .01);
  for (const s of [0, 6, 10]) stab(B, ch.s, t + s * q, .17, .022);
  if (k === 0) crash(B, t, .035); if (k === 7) riser(B, t + beat * 2, beat * 2, .05);
  if (b >= 2) for (const [s, n, d] of CB_MEL[k]) lead(B, n, t + s * e + hu(), d * e * .95, .03); // la melodia entra dalla terza battuta
  return beat * 4;
}
/** Programma una battuta del tema indicato a partire dal tempo t (secondi del contesto); restituisce la durata della battuta. */
export function playBar(B: Bus, m: Mode, b: number, t: number): number { return m === 'combat' ? combatBar(B, b, t) : calmBar(B, b, t); }

// ---- riproduzione in tempo reale: si programmano le battute con un po' di anticipo (regge anche i timer rallentati delle schede in background) ----
const LOOK = 2.5;
/** Nuovo segmento di musica: il precedente sfuma e si stacca; così il cambio tema è immediato e pulito. */
function newSeg(old: GainNode | null, fade: number): GainNode {
  const c = ctx!, g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(1, c.currentTime + fade); g.connect(mbus);
  if (old) { old.gain.cancelScheduledValues(c.currentTime); old.gain.setValueAtTime(old.gain.value, c.currentTime); old.gain.linearRampToValueAtTime(0, c.currentTime + .25); window.setTimeout(() => { try { old.disconnect(); } catch { /* già scollegato */ } }, 3500); }
  return g;
}
function tick() {
  timer = 0; if (!musicOn || !ctx) return;
  if (lastMode !== mode) { const first = lastMode === null; lastMode = mode; bar = 0; seg = newSeg(seg, first ? .02 : .3); nextT = ctx.currentTime + (first ? .1 : .05); if (!first && mode === 'combat') thump({ c: ctx, d: seg }, nextT, .5, 85, 30, .9); } // colpo di tamburo all'inizio del duello
  while (nextT < ctx.currentTime + LOOK) nextT += playBar({ c: ctx, d: seg! }, mode, bar++, nextT);
  timer = window.setTimeout(tick, 250);
}
export function unlock() { if (!ensure() || unlocked) return; unlocked = true; if (musicOn) tick(); }
export function config(m: boolean, s: boolean, mv = 1, sv = 1) { musicOn = m; sfxOn = s; mvol = mv; svol = sv; if (ctx) { mbus.gain.setTargetAtTime(m ? .8 * mv : 0, ctx.currentTime, .04); sbus.gain.value = sv; } if (!m) { clearTimeout(timer); timer = 0; lastMode = null; } else if (unlocked && !timer) tick(); }
export function setMode(m: Mode) { if (m === mode) return; mode = m; if (ctx && unlocked && musicOn) { clearTimeout(timer); tick(); } }
