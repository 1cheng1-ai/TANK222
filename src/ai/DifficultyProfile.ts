import type { Difficulty } from '@/types/common';
import type { DifficultyProfile } from '@/config/types';
import { gameConfig } from '@/config';

export class DifficultyProfileProvider {
  static get(difficulty: Difficulty): DifficultyProfile {
    return gameConfig.difficulties[difficulty];
  }
}