<script setup lang="ts">
import type { GameResult } from '@/types/result';
import { WINNER_LABELS } from '@/ui/types';

const props = defineProps<{ result: GameResult }>();
defineEmits<{
  (e: 'restart'): void;
  (e: 'menu'): void;
}>();

function verdictClass(): string {
  const w = props.result.winner;
  if (w === 'draw') return 'draw';
  if (w === 'computer') return 'lose';
  return 'win';
}

function verdictText(): string {
  const w = props.result.winner;
  if (w === 'draw') return '平局';
  if (w === 'computer') return '挑战失败';
  return '挑战成功';
}

function winnerLabel(): string {
  return WINNER_LABELS[props.result.winner] ?? '未知';
}
</script>

<template>
  <div class="panel">
    <div class="result-banner">
      <div class="verdict" :class="verdictClass()">{{ verdictText() }}</div>
      <p class="subtitle" style="margin-bottom: 0">
        {{ result.winner === 'draw' ? '双方同归于尽' : `${winnerLabel()} 获胜` }}
      </p>
    </div>

    <div class="result-stats">
      <div class="stat-item">
        <div class="value">{{ result.killCount }}</div>
        <div class="label">击毁数</div>
      </div>
      <div class="stat-item">
        <div class="value">{{ result.durationSec.toFixed(1) }}s</div>
        <div class="label">对战时长</div>
      </div>
    </div>

    <button class="btn primary" @click="$emit('restart')">再来一局</button>
    <button class="btn ghost" @click="$emit('menu')">返回主菜单</button>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';
</style>