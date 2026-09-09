import type { Direction, Faction } from '@/types/common';
import type { BulletId, TankId, Vec2 } from '@/types/geometry';
import { createBulletId } from '@/types/geometry';

export class Bullet {
  readonly id: BulletId;
  readonly ownerId: TankId;
  readonly faction: Faction;
  position: Vec2;
  direction: Direction;
  readonly speed: number;
  alive: boolean;

  constructor(
    ownerId: TankId,
    faction: Faction,
    position: Vec2,
    direction: Direction,
    speed: number
  ) {
    this.id = createBulletId();
    this.ownerId = ownerId;
    this.faction = faction;
    this.position = { ...position };
    this.direction = direction;
    this.speed = speed;
    this.alive = true;
  }

  advance(deltaMs: number): void {
    const dist = this.speed * deltaMs;
    switch (this.direction) {
      case 'up':
        this.position.y -= dist;
        break;
      case 'down':
        this.position.y += dist;
        break;
      case 'left':
        this.position.x -= dist;
        break;
      case 'right':
        this.position.x += dist;
        break;
    }
  }

  isOutOfBounds(cols: number, rows: number): boolean {
    return (
      this.position.x < 0 ||
      this.position.x > cols ||
      this.position.y < 0 ||
      this.position.y > rows
    );
  }

  destroy(): void {
    this.alive = false;
  }
}