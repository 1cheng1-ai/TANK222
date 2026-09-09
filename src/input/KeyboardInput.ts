import type { Direction } from '@/types/common';
import type { TankId } from '@/types/geometry';
import { CommandBuffer } from './CommandBuffer';
import type { ICommandSource, PlayerCommand } from './types';

const PREVENT_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Enter',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD'
]);

interface PlayerBinding {
  tankId: TankId;
  up: string;
  down: string;
  left: string;
  right: string;
  fire: string;
}

export class KeyboardInput implements ICommandSource {
  private buffer: CommandBuffer;
  private bindings: PlayerBinding[] = [];
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;
  private attached = false;

  constructor(buffer: CommandBuffer) {
    this.buffer = buffer;
    this.keyDownHandler = (e) => this.onKeyDown(e);
    this.keyUpHandler = (e) => this.onKeyUp(e);
  }

  attach(): void {
    if (this.attached) return;
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    this.attached = false;
  }

  bindPlayer1(tankId: TankId): void {
    this.bindings.push({
      tankId,
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
      fire: 'Space'
    });
    this.buffer.registerPlayer(tankId);
  }

  bindPlayer2(tankId: TankId): void {
    this.bindings.push({
      tankId,
      up: 'KeyW',
      down: 'KeyS',
      left: 'KeyA',
      right: 'KeyD',
      fire: 'Enter'
    });
    this.buffer.registerPlayer(tankId);
  }

  clearBindings(): void {
    this.bindings = [];
    this.buffer.clearPlayers();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (PREVENT_KEYS.has(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    for (const binding of this.bindings) {
      if (e.code === binding.fire) {
        this.buffer.pressFire(binding.tankId);
        return;
      }
      const dir = this.codeToDirection(e.code, binding);
      if (dir) {
        this.buffer.pressDirection(binding.tankId, dir);
        return;
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    for (const binding of this.bindings) {
      const dir = this.codeToDirection(e.code, binding);
      if (dir) {
        this.buffer.releaseDirection(binding.tankId, dir);
        return;
      }
    }
  }

  private codeToDirection(code: string, binding: PlayerBinding): Direction | null {
    if (code === binding.up) return 'up';
    if (code === binding.down) return 'down';
    if (code === binding.left) return 'left';
    if (code === binding.right) return 'right';
    return null;
  }

  poll(): PlayerCommand[] {
    return this.buffer.flush();
  }

  reset(): void {
    this.buffer.reset();
  }
}