import type { Difficulty } from '@/types/common';
import type { DifficultyProfile } from './types';

export const difficultyConfig: Record<Difficulty, DifficultyProfile> = {
  easy: {
    reactionMs: 800,
    fireProbability: 0.3,
    randomDisturbance: 0.4
  },
  normal: {
    reactionMs: 400,
    fireProbability: 0.6,
    randomDisturbance: 0.15
  },
  hard: {
    reactionMs: 200,
    fireProbability: 0.9,
    randomDisturbance: 0
  }
};