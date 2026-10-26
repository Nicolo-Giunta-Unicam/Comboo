// Parametri di bilanciamento: valori in data/game.json (sezione "config").
import { GAME as J } from './gamedata';
const C = J.config;
export const CONFIG = { ...C, reward: (arena: number) => C.reward.base + arena * C.reward.perArena, energyPrice: (n: number) => C.energyPrice.base + C.energyPrice.step * n };
