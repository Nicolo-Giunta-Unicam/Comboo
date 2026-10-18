// REGOLE DA COMPLETARE: isolate qui, sostituire senza toccare il resto.
import type { Run } from './engine';
/** DECISIONE APERTA: cosa succede alle 3 mosse di un equipaggiamento rimosso/venduto.
 *  Provvisorio: nessuna mossa conservata (restano inutilizzabili finché non si reinstalla).
 *  Restituire uid di carte da conservare ("eq:<id>:<i>") per cambiare comportamento. */
export function movesRetainedAfterRemoval(_r: Run, _equipId: string): string[] { return []; }
/** DECISIONE APERTA: esiti di sconfitta (sopravvivenza, risparmio, fuga). Provvisorio: fine run. */
export function defeatOutcome(_r: Run): 'end-run' { return 'end-run'; }
