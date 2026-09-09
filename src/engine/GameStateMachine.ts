import type { GamePhase } from '@/types/common';

export interface StateListener {
  (state: GamePhase): void;
}

export class GameStateMachine {
  private current: GamePhase;
  private listeners: StateListener[] = [];

  constructor(initial: GamePhase = 'mainMenu') {
    this.current = initial;
  }

  get(): GamePhase {
    return this.current;
  }

  transitionTo(state: GamePhase): void {
    if (state === this.current) return;
    this.current = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.current);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) {
        this.listeners.splice(idx, 1);
      }
    };
  }
}