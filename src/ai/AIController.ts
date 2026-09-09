import type { Tank } from '@/entities/Tank';
import type { Base } from '@/entities/Base';
import type { Obstacle } from '@/entities/Obstacle';
import type { Difficulty, Direction, Faction } from '@/types/common';
import type { Vec2 } from '@/types/geometry';
import type { PlayerCommand, TankAction } from '@/input/types';
import type { DifficultyProfile } from '@/config/types';
import { DIRECTIONS, DIRECTION_VECTORS } from '@/types/common';

interface AIContext {
  tank: Tank;
  enemies: Tank[];
  enemyBases: Base[];
  obstacles: Obstacle[];
  otherTanks: Tank[];
  cols: number;
  rows: number;
}

export class AIController {
  private profile: DifficultyProfile;
  private lastDecisionTime = 0;
  private lastAction: TankAction = { kind: 'idle' };

  constructor(difficulty: Difficulty, profile: DifficultyProfile) {
    this.profile = profile;
    void difficulty;
  }

  decide(ctx: AIContext, now: number): PlayerCommand | null {
    const tank = ctx.tank;
    if (!tank.alive) return null;

    if (now - this.lastDecisionTime < this.profile.reactionMs) {
      return { tankId: tank.id, action: this.lastAction };
    }
    this.lastDecisionTime = now;

    const target = this.chooseTarget(ctx);
    if (!target) {
      this.lastAction = { kind: 'idle' };
      return { tankId: tank.id, action: this.lastAction };
    }

    const desiredDir = this.directionToward(tank.position, target);
    const fireAction = this.tryFire(tank, target, ctx);

    if (fireAction) {
      this.lastAction = fireAction;
      return { tankId: tank.id, action: fireAction };
    }

    const moveDir = this.chooseMoveDirection(ctx, desiredDir);
    if (moveDir) {
      this.lastAction = { kind: 'move', direction: moveDir };
    } else {
      this.lastAction = { kind: 'idle' };
    }
    return { tankId: tank.id, action: this.lastAction };
  }

  reset(): void {
    this.lastDecisionTime = 0;
    this.lastAction = { kind: 'idle' };
  }

  private chooseTarget(ctx: AIContext): Vec2 | null {
    const candidates: { pos: Vec2; dist: number }[] = [];
    for (const enemy of ctx.enemies) {
      if (!enemy.alive) continue;
      candidates.push({
        pos: enemy.position,
        dist: this.manhattan(ctx.tank.position, enemy.position)
      });
    }
    for (const base of ctx.enemyBases) {
      if (base.destroyed) continue;
      const center = { x: base.position.col + 0.5, y: base.position.row + 0.5 };
      candidates.push({
        pos: center,
        dist: this.manhattan(ctx.tank.position, center)
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.dist - b.dist);

    if (this.profile.randomDisturbance > 0 && Math.random() < this.profile.randomDisturbance) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      return pick.pos;
    }
    return candidates[0].pos;
  }

  private directionToward(from: Vec2, to: Vec2): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  private tryFire(tank: Tank, target: Vec2, ctx: AIContext): TankAction | null {
    if (!tank.canFire()) return null;
    if (Math.random() > this.profile.fireProbability) return null;

    const aligned = this.isAligned(tank.position, target, tank.direction);
    if (!aligned) return null;

    if (this.hasObstacleInLine(tank, target, ctx)) return null;
    return { kind: 'fire' };
  }

  private isAligned(from: Vec2, to: Vec2, dir: Direction): boolean {
    const tolerance = 0.5;
    switch (dir) {
      case 'up':
        return Math.abs(from.x - to.x) < tolerance && to.y < from.y;
      case 'down':
        return Math.abs(from.x - to.x) < tolerance && to.y > from.y;
      case 'left':
        return Math.abs(from.y - to.y) < tolerance && to.x < from.x;
      case 'right':
        return Math.abs(from.y - to.y) < tolerance && to.x > from.x;
    }
  }

  private hasObstacleInLine(tank: Tank, target: Vec2, ctx: AIContext): boolean {
    const startCol = Math.floor(tank.position.x);
    const startRow = Math.floor(tank.position.y);
    const endCol = Math.floor(target.x);
    const endRow = Math.floor(target.y);
    if (tank.direction === 'up' || tank.direction === 'down') {
      const step = tank.direction === 'up' ? -1 : 1;
      for (let r = startRow + step; r !== endRow + step; r += step) {
        if (r < 0 || r >= ctx.rows) return true;
        const obs = ctx.obstacles.find(
          (o) => !o.destroyed && o.position.col === startCol && o.position.row === r
        );
        if (obs) return true;
      }
    } else {
      const step = tank.direction === 'left' ? -1 : 1;
      for (let c = startCol + step; c !== endCol + step; c += step) {
        if (c < 0 || c >= ctx.cols) return true;
        const obs = ctx.obstacles.find(
          (o) => !o.destroyed && o.position.col === c && o.position.row === startRow
        );
        if (obs) return true;
      }
    }
    return false;
  }

  private chooseMoveDirection(ctx: AIContext, preferred: Direction): Direction | null {
    const blocked = new Set<Direction>();
    for (const dir of DIRECTIONS) {
      if (this.isBlocked(ctx, dir)) {
        blocked.add(dir);
      }
    }
    if (blocked.size === 4) return null;
    if (!blocked.has(preferred)) return preferred;

    const available = DIRECTIONS.filter((d) => !blocked.has(d));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  private isBlocked(ctx: AIContext, dir: Direction): boolean {
    const v = DIRECTION_VECTORS[dir];
    const next: Vec2 = { x: ctx.tank.position.x + v.x, y: ctx.tank.position.y + v.y };
    if (next.x < 0.5 || next.x > ctx.cols - 0.5) return true;
    if (next.y < 0.5 || next.y > ctx.rows - 0.5) return true;
    const col = Math.floor(next.x);
    const row = Math.floor(next.y);
    const obs = ctx.obstacles.find(
      (o) => !o.destroyed && o.position.col === col && o.position.row === row
    );
    if (obs) return true;
    for (const other of ctx.otherTanks) {
      if (!other.alive) continue;
      if (Math.hypot(next.x - other.position.x, next.y - other.position.y) < 0.9) return true;
    }
    return false;
  }

  private manhattan(a: Vec2, b: Vec2): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}

export type { Faction };