import type { ObstacleType } from '@/types/common';
import type { GridPos } from '@/types/geometry';

export class Obstacle {
  readonly position: GridPos;
  readonly type: ObstacleType;
  destroyed: boolean;

  constructor(position: GridPos, type: ObstacleType) {
    this.position = { ...position };
    this.type = type;
    this.destroyed = false;
  }

  isDestructible(): boolean {
    return this.type === 'brick';
  }

  destroy(): void {
    if (this.isDestructible()) {
      this.destroyed = true;
    }
  }
}