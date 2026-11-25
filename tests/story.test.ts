import { test } from 'node:test'; import assert from 'node:assert/strict';
import { newRun, epilogueOf, defeatOf, makeChoice, pendingChoice, chooseRegion, condOk } from '../src/engine';
import { CHOICES, EPILOGUES } from '../src/data'; import { REGION_LIST } from '../src/regions';

const flagsOf = (s?: string) => (s ?? '').split(',').map(x => x.trim()).filter(Boolean);
const usedFlags = (): Set<string> => { const u = new Set<string>(); const walk = (x: unknown): void => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if ((k === 'flag' || k === 'noFlag') && typeof v === 'string') flagsOf(v).forEach(f => u.add(f)); else walk(v); } };
  CHOICES.forEach(c => { walk(c.needs); walk(c.extra); c.options.forEach(o => walk(o.req)); }); EPILOGUES.forEach(e => { walk(e.needs); walk(e.extra); }); return u; };

test('storia: ogni flag impostato da una scelta viene letto da qualche parte (tranne end_fighter, che è il finale di ripiego)', () => {
  const set = new Set<string>(); CHOICES.forEach(c => c.options.forEach(o => flagsOf(o.flag).forEach(f => set.add(f)))); const used = usedFlags();
  assert.deepEqual([...set].filter(f => !used.has(f) && f !== 'end_fighter'), []);
});
test('storia: nessun flag letto senza che una scelta lo imposti', () => {
  const set = new Set<string>(); CHOICES.forEach(c => c.options.forEach(o => flagsOf(o.flag).forEach(f => set.add(f)))); assert.deepEqual([...usedFlags()].filter(f => !set.has(f)), []);
});
test('storia: ogni evento ha sempre almeno una opzione scegliibile da chiunque (nessun blocco totale)', () => {
  for (const c of CHOICES) assert.ok(c.options.some(o => !o.req), c.id);
});
test('storia: il primo capitolo è un voto (verità, lealtà o nome) che cambia gli epiloghi di vittoria e di sconfitta', () => {
  const muro = CHOICES.find(c => c.id === 'boxing-muro')!; assert.deepEqual(muro.options.map(o => flagsOf(o.flag).find(f => f.startsWith('vow_'))).sort(), ['vow_loyal', 'vow_name', 'vow_truth']);
  for (const id of ['throne', 'break', 'legend', 'fighter']) { const e = EPILOGUES.find(x => x.id === id)!; for (const f of ['vow_name', 'vow_loyal', 'vow_truth']) assert.ok(e.extra?.some(x => x.if?.flag === f), `${id}/${f}`); }
  const all = EPILOGUES.find(x => x.id === 'defeat-all')!; for (const f of ['vow_name', 'vow_loyal', 'vow_truth']) assert.ok(all.extra?.some(x => x.if?.flag === f), `defeat-all/${f}`);
});
test('sconfitta: ogni isola ha il suo epilogo e le righe comuni dipendono dal voto; la vittoria non pesca mai un epilogo di sconfitta', () => {
  for (const g of REGION_LIST) { const r = newRun(1); r.region = g.id; const df = defeatOf(r); assert.ok(df && df.title && df.paras.length >= 1, g.id); }
  const r = newRun(1); r.region = 'boxing'; r.flags = ['vow_name', 'gorin_bond']; const df = defeatOf(r)!; assert.equal(df.paras.length, 3, 'testo dell\'isola + eco di Gorin + riga sul voto');
  r.flags = []; assert.equal(defeatOf(r)!.paras.length, 1);
  for (const f of ['end_throne', 'end_break', 'end_legend', 'none']) { const q = newRun(1); q.flags = f === 'none' ? [] : [f]; assert.ok(!epilogueOf(q)!.title.startsWith('Sconfitta') && !EPILOGUES.find(e => e.title === epilogueOf(q)!.title)!.id.startsWith('defeat-'), f); }
});
test('dilemmi: chi è già molto onorevole non può scegliere le opzioni più spietate; le nuove opzioni richiamano i personaggi incontrati', () => {
  const man = CHOICES.find(c => c.id === 'boxing-manager')!.options.find(o => o.id === 'a')!; const hi = newRun(1); hi.virt = { honor: 60, fame: 20, ambition: 30 }; assert.equal(condOk(hi, man.req), false);
  const lo = newRun(1); lo.virt = { honor: 30, fame: 20, ambition: 30 }; assert.equal(condOk(lo, man.req), true);
  const sirena = CHOICES.find(c => c.id === 'ocean-sirena')!.options.find(o => o.id === 'd')!; const q = newRun(1); assert.equal(condOk(q, sirena.req), false); q.flags = ['gorin_bond']; assert.equal(condOk(q, sirena.req), true);
});
