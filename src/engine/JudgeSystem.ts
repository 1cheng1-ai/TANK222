import type { EntityManager } from './EntityManager';
import type { BattleMode, Faction } from '@/types/common';
import type { GameResult } from '@/types/result';

export class JudgeSystem {
  private startTime: number;
  private killCount = 0;
  private mode: BattleMode;

  constructor(mode: BattleMode) {
    this.mode = mode;
    this.startTime = performance.now();
  }

  recordKill(): void {
    this.killCount += 1;
  }

  check(entities: EntityManager): GameResult | null {
    const durationSec = (performance.now() - this.startTime) / 1000;

    if (this.mode === 'pve') {
      const player1Alive = this.isFactionAlive(entities, 'player1');
      const computerAlive = this.isFactionAlive(entities, 'computer');

      if (!player1Alive && !computerAlive) {
        return { winner: 'draw', killCount: this.killCount, durationSec };
      }
      if (!player1Alive) {
        return { winner: 'computer', killCount: this.killCount, durationSec };
      }
      if (!computerAlive) {
        return { winner: 'player1', killCount: this.killCount, durationSec };
      }
      return null;
    }

    const player1Alive = this.isFactionAlive(entities, 'player1');
    const player2Alive = this.isFactionAlive(entities, 'player2');

    if (!player1Alive && !player2Alive) {
      return { winner: 'draw', killCount: this.killCount, durationSec };
    }
    if (!player1Alive) {
      return { winner: 'player2', killCount: this.killCount, durationSec };
    }
    if (!player2Alive) {
      return { winner: 'player1', killCount: this.killCount, durationSec };
    }
    return null;
  }

  private isFactionAlive(entities: EntityManager, faction: Faction): boolean {
    const base = entities.getBaseByFaction(faction);
    if (base && base.destroyed) return false;
    const tanks = entities.tanks.filter((t) => t.faction === faction);
    if (tanks.length === 0) return false;
    return tanks.some((t) => t.alive);
  }

  reset(): void {
    this.startTime = performance.now();
    this.killCount = 0;
  }
}
