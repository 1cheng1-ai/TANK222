import type { Difficulty, Faction, ObstacleType } from '@/types/common';
import type { GridPos } from '@/types/geometry';

export interface ObstacleSeed {
  pos: GridPos;
  type: ObstacleType;
}

export interface TankSpawn {
  faction: Faction;
  pos: GridPos;
}

export interface BaseSeed {
  faction: Faction;
  pos: GridPos;
}

export interface MapConfig {
  cols: number;
  rows: number;
  obstacles: ObstacleSeed[];
  tanks: TankSpawn[];
  bases: BaseSeed[];
}

export interface DifficultyProfile {
  reactionMs: number;
  fireProbability: number;
  randomDisturbance: number;
}

export interface TankConfig {
  playerHp: number;
  computerHp: number;
  moveSpeed: number;
  fireCooldownMs: number;
  bulletSpeed: number;
}

export interface IGameConfig {
  map: MapConfig;
  difficulties: Record<Difficulty, DifficultyProfile>;
  tank: TankConfig;
}