import type { IGameConfig } from './types';
import { mapConfig } from './map.config';
import { difficultyConfig } from './difficulty.config';
import { tankConfig } from './tank.config';

export const gameConfig: IGameConfig = {
  map: mapConfig,
  difficulties: difficultyConfig,
  tank: tankConfig
};

export type {
  IGameConfig,
  MapConfig,
  DifficultyProfile,
  TankConfig,
  ObstacleSeed,
  TankSpawn,
  BaseSeed
} from './types';