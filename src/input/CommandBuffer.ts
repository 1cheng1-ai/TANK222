import type { Direction } from '@/types/common';
import type { TankId } from '@/types/geometry';
import type { PlayerCommand, TankAction } from './types';

interface PlayerKeyState {
  tankId: TankId;
  pressedDirections: Direction[];
  fireEdge: boolean;
}

export class CommandBuffer {
  private players: PlayerKeyState[] = [];
  private pendingCommands: PlayerCommand[] = [];

  registerPlayer(tankId: TankId): void {
    this.players.push({
      tankId,
      pressedDirections: [],
      fireEdge: false
    });
  }

  clearPlayers(): void {
    this.players = [];
    this.pendingCommands = [];
  }

  pressDirection(tankId: TankId, direction: Direction): void {
    const state = this.findState(tankId);
    if (!state) return;
    const idx = state.pressedDirections.indexOf(direction);
    if (idx >= 0) {
      state.pressedDirections.splice(idx, 1);
    }
    state.pressedDirections.push(direction);
  }

  releaseDirection(tankId: TankId, direction: Direction): void {
    const state = this.findState(tankId);
    if (!state) return;
    const idx = state.pressedDirections.indexOf(direction);
    if (idx >= 0) {
      state.pressedDirections.splice(idx, 1);
    }
  }

  pressFire(tankId: TankId): void {
    const state = this.findState(tankId);
    if (!state) return;
    state.fireEdge = true;
  }

  flush(): PlayerCommand[] {
    const commands: PlayerCommand[] = [];
    for (const state of this.players) {
      const action = this.buildAction(state);
      commands.push({ tankId: state.tankId, action });
      state.fireEdge = false;
    }
    return commands;
  }

  private buildAction(state: PlayerKeyState): TankAction {
    if (state.fireEdge) {
      return { kind: 'fire' };
    }
    if (state.pressedDirections.length > 0) {
      const direction = state.pressedDirections[state.pressedDirections.length - 1];
      return { kind: 'move', direction };
    }
    return { kind: 'idle' };
  }

  private findState(tankId: TankId): PlayerKeyState | undefined {
    return this.players.find((s) => s.tankId === tankId);
  }

  reset(): void {
    for (const state of this.players) {
      state.pressedDirections = [];
      state.fireEdge = false;
    }
    this.pendingCommands = [];
  }
}