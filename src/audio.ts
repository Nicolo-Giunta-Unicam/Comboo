// Audio procedurale (WebAudio): nessun file esterno. Musica generativa + effetti sonori.
type Mode = 'calm' | 'combat';
let ctx: AudioContext | null = null, master: GainNode, mbus: GainNode, sbus: GainNode, mvol = 1, svol = 1, musicOn = true, sfxOn = true, mode: Mode = 'calm', timer = 0, bar = 0, unlocked = false, seed = 7;
const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
function ensure() { if (!AC) return null; if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    sbus = ctx.createGain(); sbus.gain.value = svol; sbus.connect(master); mbus = ctx.createGain(); mbus.gain.value = .8 * mvol; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; mbus.connect(lp); lp.connect(master);
    const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(); dl.delayTime.value = .42; fb.gain.value = .38; wet.gain.value = .35; lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master); } if (ctx.state === 'suspended') void ctx.resume(); return ctx; }
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
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12), rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
/** Nota morbida: due oscillatori leggermente scordati, attacco lento, rilascio lungo; passa da filtro passa-basso ed eco. */
function note(m: number, t: number, d: number, v: number, a = .06, type: OscillatorType = 'sine') {
  const c = ctx!, g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d); g.connect(mbus);
  [-3, 3].forEach(dt => { const o = c.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(g); o.start(t); o.stop(t + d + .05); });
}
const CH = [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 52]], PEN = [0, 2, 4, 7, 9]; let mi = 5; // Do maj7 - La m7 - Fa maj7 - Sol6, melodia pentatonica
function bars() {
  timer = 0; if (!musicOn || !ctx) return;
  const beat = 60 / (mode === 'combat' ? 78 : 62), t = ctx.currentTime + .08, ch = CH[bar % 4], len = beat * 4;
  ch.forEach(m => note(m, t, len * 1.1, .03, .5)); note(ch[0] - 12, t, len, .05, .3);
  for (let b = 0; b < 8; b++) if (rnd() < .5) { mi = Math.max(0, Math.min(9, mi + Math.floor(rnd() * 5) - 2)); note(60 + 12 * Math.floor(mi / 5) + PEN[mi % 5], t + b * beat / 2, beat * (1 + rnd() * 1.5), .045, .04, 'triangle'); }
  if (mode === 'combat') for (let b = 0; b < 8; b++) note(ch[b % 4] + 12, t + b * beat / 2, beat * .6, .018, .03);
  bar++; timer = window.setTimeout(bars, len * 1000 - 100);
}
export function unlock() { if (!ensure() || unlocked) return; unlocked = true; if (musicOn) bars(); }
export function config(m: boolean, s: boolean, mv = 1, sv = 1) { musicOn = m; sfxOn = s; mvol = mv; svol = sv; if (ctx) { mbus.gain.value = .8 * mv; sbus.gain.value = sv; } if (!m) { clearTimeout(timer); timer = 0; } else if (unlocked && !timer) bars(); }
export function setMode(m: Mode) { mode = m; }
