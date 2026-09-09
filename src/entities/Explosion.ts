import type { Vec2 } from '@/types/geometry';

export class Explosion {
  readonly position: Vec2;
  elapsedMs: number;
  readonly durationMs: number;
  readonly maxRadius: number;

  constructor(position: Vec2, durationMs = 320, maxRadius = 0.7) {
    this.position = { ...position };
    this.elapsedMs = 0;
    this.durationMs = durationMs;
    this.maxRadius = maxRadius;
  }

  advance(deltaMs: number): void {
    this.elapsedMs += deltaMs;
  }

  isFinished(): boolean {
    return this.elapsedMs >= this.durationMs;
  }

  get progress(): number {
    return Math.min(1, this.elapsedMs / this.durationMs);
  }
}