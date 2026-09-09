import type { BattleMode, Difficulty, GamePhase } from '@/types/common';
import type { GameResult } from '@/types/result';

export interface IUiState {
  phase: GamePhase;
  selectedMode: BattleMode;
  selectedDifficulty: Difficulty;
  result: GameResult | null;
  error: string | null;
}

export const MODE_LABELS: Record<BattleMode, string> = {
  pve: '人机对战',
  pvp: '双人对战'
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难'
};

export const WINNER_LABELS: Record<string, string> = {
  player1: '玩家1',
  player2: '玩家2',
  computer: '电脑',
  draw: '平局'
};