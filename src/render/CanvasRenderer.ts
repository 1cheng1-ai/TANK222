import type { Tank } from '@/entities/Tank';
import type { Bullet } from '@/entities/Bullet';
import type { Obstacle } from '@/entities/Obstacle';
import type { Base } from '@/entities/Base';
import type { Explosion } from '@/entities/Explosion';
import { Camera } from './Camera';
import { spritePainter } from './SpritePainter';

export interface ICanvasRenderer {
  clear(): void;
  drawTerrain(): void;
  drawObstacle(obstacle: Obstacle): void;
  drawBase(base: Base): void;
  drawTank(tank: Tank): void;
  drawBullet(bullet: Bullet): void;
  drawExplosion(explosion: Explosion): void;
}

export class CanvasRenderer implements ICanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private painter = spritePainter;

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    this.ctx = ctx;
    this.camera = camera;
  }

  getCamera(): Camera {
    return this.camera;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.camera.pixelWidth, this.camera.pixelHeight);
  }

  drawTerrain(): void {
    const cellSize = this.camera.getCellSize();
    this.painter.paintTerrain(
      { ctx: this.ctx, cellSize },
      this.camera.cols,
      this.camera.rows
    );
  }

  drawObstacle(obstacle: Obstacle): void {
    if (obstacle.destroyed) return;
    const cellSize = this.camera.getCellSize();
    const px = this.camera.gridToPixel(obstacle.position);
    if (obstacle.type === 'brick') {
      this.painter.paintBrick({ ctx: this.ctx, cellSize }, px.x, px.y);
    } else {
      this.painter.paintSteel({ ctx: this.ctx, cellSize }, px.x, px.y);
    }
  }

  drawBase(base: Base): void {
    const cellSize = this.camera.getCellSize();
    const px = this.camera.gridToPixel(base.position);
    this.painter.paintBase(
      { ctx: this.ctx, cellSize },
      px.x,
      px.y,
      base.faction,
      base.destroyed
    );
  }

  drawTank(tank: Tank): void {
    if (!tank.alive) return;
    const cellSize = this.camera.getCellSize();
    const px = this.camera.logicalToPixel(tank.position);
    this.painter.paintTank(
      { ctx: this.ctx, cellSize },
      px,
      tank.direction,
      tank.faction,
      tank.hp / tank.maxHp
    );
  }

  drawBullet(bullet: Bullet): void {
    if (!bullet.alive) return;
    const cellSize = this.camera.getCellSize();
    const px = this.camera.logicalToPixel(bullet.position);
    this.painter.paintBullet({ ctx: this.ctx, cellSize }, px, bullet.faction);
  }

  drawExplosion(explosion: Explosion): void {
    const cellSize = this.camera.getCellSize();
    const px = this.camera.logicalToPixel(explosion.position);
    this.painter.paintExplosion(
      { ctx: this.ctx, cellSize },
      px,
      explosion.progress,
      explosion.maxRadius
    );
  }
}