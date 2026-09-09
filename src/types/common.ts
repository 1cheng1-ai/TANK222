export type Direction = 'up' | 'down' | 'left' | 'right';

export type Faction = 'player1' | 'player2' | 'computer';

export type ObstacleType = 'brick' | 'steel';

export type BattleMode = 'pve' | 'pvp';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type GamePhase =
  | 'mainMenu'
  | 'modeSelect'
  | 'difficultySelect'
  | 'help'
  | 'battle'
  | 'result';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'] as const;

export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

export function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}