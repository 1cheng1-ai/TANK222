<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { GameEngine } from '@/engine/GameEngine';
import type { IUiState } from '@/engine/GameEngine';
import MainMenuView from '@/ui/components/MainMenuView.vue';
import ModeSelectView from '@/ui/components/ModeSelectView.vue';
import DifficultySelectView from '@/ui/components/DifficultySelectView.vue';
import HelpView from '@/ui/components/HelpView.vue';
import BattleView from '@/ui/components/BattleView.vue';
import ResultView from '@/ui/components/ResultView.vue';

const engine = new GameEngine();
const state = ref<IUiState>({
  phase: 'mainMenu',
  selectedMode: 'pve',
  selectedDifficulty: 'normal',
  result: null,
  error: null
});

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  engine.start();
  unsubscribe = engine.subscribeUiState((s) => {
    state.value = s;
  });
});

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  engine.dispose();
});

const showMenu = computed(() => state.value.phase === 'mainMenu');
const showMode = computed(() => state.value.phase === 'modeSelect');
const showDifficulty = computed(() => state.value.phase === 'difficultySelect');
const showHelp = computed(() => state.value.phase === 'help');
const showBattle = computed(() => state.value.phase === 'battle' && !state.value.error);
const showResult = computed(() => state.value.phase === 'result');
const showError = computed(
  () => !!state.value.error && state.value.phase !== 'mainMenu'
);

function handleStart() {
  engine.beginBattle();
}
function handleMode() {
  engine.goToModeSelect();
}
function handleDifficulty() {
  engine.goToDifficultySelect();
}
function handleHelp() {
  engine.goToHelp();
}
function handleModeSelect(mode: 'pve' | 'pvp') {
  engine.setMode(mode);
}
function handleDifficultySelect(d: 'easy' | 'normal' | 'hard') {
  engine.setDifficulty(d);
}
function handleBack() {
  engine.backToMenu();
}
function handleExitBattle() {
  engine.backToMenu();
}
function handleRestart() {
  engine.restartBattle();
}
</script>

<template>
  <MainMenuView
    v-if="showMenu"
    @start="handleStart"
    @mode="handleMode"
    @difficulty="handleDifficulty"
    @help="handleHelp"
  />
  <ModeSelectView
    v-else-if="showMode"
    :current="state.selectedMode"
    @select="handleModeSelect"
    @back="handleBack"
  />
  <DifficultySelectView
    v-else-if="showDifficulty"
    :current="state.selectedDifficulty"
    @select="handleDifficultySelect"
    @back="handleBack"
  />
  <HelpView v-else-if="showHelp" @back="handleBack" />
  <BattleView v-else-if="showBattle" :engine="engine" @exit="handleExitBattle" />
  <ResultView
    v-else-if="showResult && state.result"
    :result="state.result"
    @restart="handleRestart"
    @menu="handleBack"
  />
  <div v-else-if="showError" class="panel">
    <p class="error-banner">{{ state.error }}</p>
    <button class="btn primary" @click="handleBack">返回主菜单</button>
  </div>
  <div v-else class="panel">
    <p class="error-banner">未知状态: {{ state.phase }}</p>
    <button class="btn primary" @click="handleBack">返回主菜单</button>
  </div>
</template>

<style scoped>
.panel {
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 18px;
  padding: 42px 48px;
  color: #e2e8f0;
  min-width: 360px;
}
.error-banner {
  text-align: center;
  color: #fca5a5;
  margin-bottom: 18px;
  font-size: 14px;
  word-break: break-all;
}
.btn {
  display: block;
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  color: #e2e8f0;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: 1px solid rgba(147, 197, 253, 0.7);
  border-radius: 12px;
}
</style>
