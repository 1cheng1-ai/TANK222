<script setup lang="ts">
import { ref } from 'vue';
import type { BattleMode } from '@/types/common';
import { MODE_LABELS } from '@/ui/types';

const props = defineProps<{ current: BattleMode }>();
const emit = defineEmits<{
  (e: 'select', mode: BattleMode): void;
  (e: 'back'): void;
}>();

const selected = ref<BattleMode>(props.current);

function choose(mode: BattleMode) {
  selected.value = mode;
  emit('select', mode);
}
</script>

<template>
  <div class="panel">
    <h1 class="title">对战模式</h1>
    <p class="subtitle">选择你的对手</p>
    <div class="option-row">
      <button
        v-for="(label, key) in MODE_LABELS"
        :key="key"
        class="option"
        :class="{ active: selected === key }"
        @click="choose(key as BattleMode)"
      >
        {{ label }}
      </button>
    </div>
    <button class="btn primary" @click="$emit('back')">返回主菜单</button>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';
</style>