export class GameLoop {
  private running = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly stepMs: number;
  private updateFn: (deltaMs: number) => void;

  constructor(updateFn: (deltaMs: number) => void, stepMs = 1000 / 60) {
    this.updateFn = updateFn;
    this.stepMs = stepMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private tick = (): void => {
    if (!this.running) return;
    const now = performance.now();
    let frameTime = now - this.lastTime;
    this.lastTime = now;
    if (frameTime > 250) {
      frameTime = 250;
    }
    this.accumulator += frameTime;
    while (this.accumulator >= this.stepMs) {
      this.updateFn(this.stepMs);
      this.accumulator -= this.stepMs;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}