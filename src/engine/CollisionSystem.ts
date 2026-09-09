import type { Bullet } from '@/entities/Bullet';
import type { Tank } from '@/entities/Tank';
import type { Obstacle } from '@/entities/Obstacle';
import type { Base } from '@/entities/Base';
import type { Explosion } from '@/entities/Explosion';
import type { Direction, Faction } from '@/types/common';
import type { GridPos, Vec2 } from '@/types/geometry';
import { Explosion } from '@/entities/Explosion';

export interface CollisionResult {
  newExplosions: Explosion[];
  killedTanks: Tank[];
  destroyedBases: Base[];
}

export class CollisionSystem {
  private cols: number;
  private rows: number;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
  }

  resolve(
    bullets: Bullet[],
    tanks: Tank[],
    obstacles: Obstacle[],
    bases: Base[]
  ): CollisionResult {
    const result: CollisionResult = {
      newExplosions: [],
      killedTanks: [],
      destroyedBases: []
    };

    this.resolveBulletBullet(bullets, result);
    this.resolveBulletObstacle(bullets, obstacles, result);
    this.resolveBulletBase(bullets, bases, result);
    this.resolveBulletTank(bullets, tanks, result);

    return result;
  }

  private resolveBulletBullet(bullets: Bullet[], result: CollisionResult): void {
    const alive = bullets.filter((b) => b.alive);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        if (!a.alive || !b.alive) continue;
        if (this.distance(a.position, b.position) < 0.5) {
          a.destroy();
          b.destroy();
          result.newExplosions.push(
            new Explosion(this.midpoint(a.position, b.position), 200, 0.5)
          );
        }
      }
    }
  }

  private resolveBulletObstacle(
    bullets: Bullet[],
    obstacles: Obstacle[],
    result: CollisionResult
  ): void {
    for (const bullet of bullets) {
      if (!bullet.alive) continue;
      const grid = this.toGrid(bullet.position);
      const obstacle = this.findObstacleAt(obstacles, grid);
      if (obstacle) {
        if (obstacle.isDestructible()) {
          bullet.destroy();
          result.newExplosions.push(new Explosion(this.gridCenter(grid), 240, 0.5));
          obstacle.destroy();
        } else {
          if (bullet.bounce()) {
            this.reboundPosition(bullet, grid);
          } else {
            bullet.destroy();
            result.newExplosions.push(new Explosion(this.gridCenter(grid), 240, 0.5));
          }
        }
      }
      if (this.isOutOfBounds(bullet.position)) {
        bullet.destroy();
      }
    }
  }

  private reboundPosition(bullet: Bullet, grid: GridPos): void {
    switch (bullet.direction) {
      case 'up':
        bullet.position.y = grid.row + 1;
        break;
      case 'down':
        bullet.position.y = grid.row;
        break;
      case 'left':
        bullet.position.x = grid.col + 1;
        break;
      case 'right':
        bullet.position.x = grid.col;
        break;
    }
  }

  private resolveBulletBase(
    bullets: Bullet[],
    bases: Base[],
    result: CollisionResult
  ): void {
    for (const bullet of bullets) {
      if (!bullet.alive) continue;
      for (const base of bases) {
        if (base.destroyed) continue;
        const center = this.gridCenter(base.position);
        if (this.distance(bullet.position, center) < 0.5) {
          if (bullet.faction !== base.faction) {
            bullet.destroy();
            base.destroy();
            result.destroyedBases.push(base);
            result.newExplosions.push(new Explosion(center, 400, 0.9));
          }
        }
      }
    }
  }

  private resolveBulletTank(
    bullets: Bullet[],
    tanks: Tank[],
    result: CollisionResult
  ): void {
    for (const bullet of bullets) {
      if (!bullet.alive) continue;
      for (const tank of tanks) {
        if (!tank.alive) continue;
        if (bullet.faction === tank.faction) continue;
        if (bullet.ownerId === tank.id) continue;
        if (this.distance(bullet.position, tank.position) < 0.5) {
          bullet.destroy();
          tank.takeDamage();
          result.newExplosions.push(new Explosion({ ...tank.position }, 320, 0.7));
          if (!tank.alive) {
            result.killedTanks.push(tank);
          }
        }
      }
    }
  }

  canTankMoveTo(tank: Tank, newPos: Vec2, otherTanks: Tank[], obstacles: Obstacle[]): boolean {
    if (newPos.x < 0.5 || newPos.x > this.cols - 0.5) return false;
    if (newPos.y < 0.5 || newPos.y > this.rows - 0.5) return false;

    const grid = this.toGrid(newPos);
    const occupied = this.findObstacleAt(obstacles, grid);
    if (occupied) return false;

    for (const other of otherTanks) {
      if (other.id === tank.id) continue;
      if (!other.alive) continue;
      if (this.distance(newPos, other.position) < 0.9) return false;
    }
    return true;
  }

  isDirectionBlocked(
    pos: Vec2,
    direction: Direction,
    obstacles: Obstacle[],
    otherTanks: Tank[]
  ): boolean {
    const DIRECTIONS_VEC: Record<Direction, Vec2> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    const v = DIRECTIONS_VEC[direction];
    const next: Vec2 = { x: pos.x + v.x, y: pos.y + v.y };
    if (next.x < 0.5 || next.x > this.cols - 0.5) return true;
    if (next.y < 0.5 || next.y > this.rows - 0.5) return true;
    const grid = this.toGrid(next);
    if (this.findObstacleAt(obstacles, grid)) return true;
    for (const other of otherTanks) {
      if (!other.alive) continue;
      if (this.distance(next, other.position) < 0.9) return true;
    }
    return false;
  }

  private toGrid(p: Vec2): GridPos {
    return {
      col: Math.floor(p.x),
      row: Math.floor(p.y)
    };
  }

  private gridCenter(g: GridPos): Vec2 {
    return { x: g.col + 0.5, y: g.row + 0.5 };
  }

  private findObstacleAt(obstacles: Obstacle[], grid: GridPos): Obstacle | undefined {
    return obstacles.find(
      (o) => !o.destroyed && o.position.col === grid.col && o.position.row === grid.row
    );
  }

  private distance(a: Vec2, b: Vec2): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private midpoint(a: Vec2, b: Vec2): Vec2 {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  private isOutOfBounds(p: Vec2): boolean {
    return p.x < 0 || p.x > this.cols || p.y < 0 || p.y > this.rows;
  }
}