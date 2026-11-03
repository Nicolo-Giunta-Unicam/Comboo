// Isole della mappa (da data/game.json). L'ordine è quello di sblocco.
import { GAME as J } from './gamedata';
/** moves: id delle mosse nemiche di questo avversario (ripetere un id ne aumenta la probabilità); se manca si usano quelle dell'isola. */
export interface RegionEnemy { id?: string; name: string; hpMul?: number; atkMul?: number; lore?: string; story?: string; moves?: string[] }
export interface Region { id: string; name: string; level: string; concept: string; story: string; hero: string; theme: string; palette?: { bg: string; accent: string; hi: string }; color: string; x: number; y: number; enemies: RegionEnemy[]; enemyMoves: string[] }
export const REGION_LIST: Region[] = J.regions as Region[];
export const REGIONS: Record<string, Region> = Object.fromEntries(REGION_LIST.map(r => [r.id, r]));
