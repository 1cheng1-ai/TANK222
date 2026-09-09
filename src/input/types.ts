import type { Direction } from '@/types/common';
import type { TankId } from '@/types/geometry';

export type TankAction =
  | { kind: 'move'; direction: Direction }
  | { kind: 'fire' }
  | { kind: 'idle' };

export interface PlayerCommand {
  tankId: TankId;
  action: TankAction;
}

export interface ICommandSource {
  poll(): PlayerCommand[];
  reset(): void;
}