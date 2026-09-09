import type { Direction, Faction } from '@/types/common';
import type { BulletId, TankId, Vec2 } from '@/types/geometry';
import { createBulletId } from '@/types/geometry';
import { oppositeDirection } from '@/types/common';

export class Bullet {
  readonly id: BulletId;
  readonly ownerId: TankId;
  readonly faction: Faction;
  position: Vec2;
  direction: Direction;
  readonly speed: number;
  alive: boolean;
  private bouncesRemaining: number;
  readonly maxBounces: number;

  constructor(
    ownerId: TankId,
    faction: Faction,
    position: Vec2,
    direction: Direction,
    speed: number,
    maxBounces: number = 0
  ) {
    this.id = createBulletId();
    this.ownerId = ownerId;
    this.faction = faction;
    this.position = { ...position };
    this.direction = direction;
    this.speed = speed;
    this.alive = true;
    this.maxBounces = maxBounces;
    this.bouncesRemaining = maxBounces;
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

  /**
   * 反弹：将方向取反。返回 true 表示反弹成功，false 表示反弹次数已用尽。
   */
  bounce(): boolean {
    if (this.bouncesRemaining <= 0) return false;
    this.bouncesRemaining -= 1;
    this.direction = oppositeDirection(this.direction);
    return true;
  }

  get bouncesLeft(): number {
    return this.bouncesRemaining;
  }

  destroy(): void {
    this.alive = false;
  }
}
