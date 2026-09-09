import type { Direction, Faction } from '@/types/common';
import type { TankId, Vec2 } from '@/types/geometry';
import { createTankId } from '@/types/geometry';
import { Bullet } from './Bullet';

export class Tank {
  readonly id: TankId;
  readonly faction: Faction;
  position: Vec2;
  direction: Direction;
  hp: number;
  readonly maxHp: number;
  private cooldownMs: number;
  readonly fireCooldownMs: number;
  readonly moveSpeed: number;
  readonly bulletSpeed: number;
  alive: boolean;

  constructor(
    faction: Faction,
    position: Vec2,
    direction: Direction,
    hp: number,
    fireCooldownMs: number,
    moveSpeed: number,
    bulletSpeed: number
  ) {
    this.id = createTankId();
    this.faction = faction;
    this.position = { ...position };
    this.direction = direction;
    this.hp = hp;
    this.maxHp = hp;
    this.cooldownMs = 0;
    this.fireCooldownMs = fireCooldownMs;
    this.moveSpeed = moveSpeed;
    this.bulletSpeed = bulletSpeed;
    this.alive = true;
  }

  move(deltaMs: number): void {
    const dist = this.moveSpeed * deltaMs;
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

  setDirection(direction: Direction): void {
    this.direction = direction;
  }

  canFire(): boolean {
    return this.alive && this.cooldownMs <= 0;
  }

  fire(): Bullet | null {
    if (!this.canFire()) {
      return null;
    }
    this.cooldownMs = this.fireCooldownMs;
    return new Bullet(this.id, this.faction, { ...this.position }, this.direction, this.bulletSpeed);
  }

  takeDamage(): void {
    this.hp -= 1;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  tickCooldown(deltaMs: number): void {
    if (this.cooldownMs > 0) {
      this.cooldownMs -= deltaMs;
      if (this.cooldownMs < 0) {
        this.cooldownMs = 0;
      }
    }
  }

  get cooldownRatio(): number {
    return Math.max(0, this.cooldownMs / this.fireCooldownMs);
  }
}