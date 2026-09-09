import type { Tank } from '@/entities/Tank';
import type { Bullet } from '@/entities/Bullet';
import type { Obstacle } from '@/entities/Obstacle';
import type { Base } from '@/entities/Base';
import type { Explosion } from '@/entities/Explosion';
import type { Faction } from '@/types/common';
import type { GridPos } from '@/types/geometry';

export class EntityManager {
  tanks: Tank[] = [];
  bullets: Bullet[] = [];
  obstacles: Obstacle[] = [];
  bases: Base[] = [];
  explosions: Explosion[] = [];

  addTank(tank: Tank): void {
    this.tanks.push(tank);
  }
  addBullet(bullet: Bullet): void {
    this.bullets.push(bullet);
  }
  addObstacle(obstacle: Obstacle): void {
    this.obstacles.push(obstacle);
  }
  addBase(base: Base): void {
    this.bases.push(base);
  }
  addExplosion(explosion: Explosion): void {
    this.explosions.push(explosion);
  }

  getTanksByFaction(faction: Faction): Tank[] {
    return this.tanks.filter((t) => t.faction === faction && t.alive);
  }

  getBaseByFaction(faction: Faction): Base | undefined {
    return this.bases.find((b) => b.faction === faction);
  }

  getObstacleAt(pos: GridPos): Obstacle | undefined {
    return this.obstacles.find(
      (o) => !o.destroyed && o.position.col === pos.col && o.position.row === pos.row
    );
  }

  getAliveTanks(): Tank[] {
    return this.tanks.filter((t) => t.alive);
  }

  getAliveBullets(): Bullet[] {
    return this.bullets.filter((b) => b.alive);
  }

  gc(): void {
    this.bullets = this.bullets.filter((b) => b.alive);
    this.explosions = this.explosions.filter((e) => !e.isFinished());
  }

  clear(): void {
    this.tanks = [];
    this.bullets = [];
    this.obstacles = [];
    this.bases = [];
    this.explosions = [];
  }
}