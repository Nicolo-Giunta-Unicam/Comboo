// Isole della mappa (da data/game.json). L'ordine è quello di sblocco.
import J from '../data/game.json';
export interface RegionEnemy { id?: string; name: string; hpMul?: number; atkMul?: number; lore?: string; story?: string }
export interface Region { id: string; name: string; level: string; concept: string; story: string; hero: string; theme: string; color: string; x: number; y: number; enemies: RegionEnemy[]; enemyMoves: string[] }
export const REGION_LIST: Region[] = J.regions as Region[];
export const REGIONS: Record<string, Region> = Object.fromEntries(REGION_LIST.map(r => [r.id, r]));
