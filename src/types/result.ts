import type { Faction } from './common';

export type Winner = Faction | 'draw';

export interface GameResult {
  winner: Winner;
  killCount: number;
  durationSec: number;
}