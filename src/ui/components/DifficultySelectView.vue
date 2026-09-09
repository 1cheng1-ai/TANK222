<script setup lang="ts">
import { ref } from 'vue';
import type { Difficulty } from '@/types/common';
import { DIFFICULTY_LABELS } from '@/ui/types';

const props = defineProps<{ current: Difficulty }>();
const emit = defineEmits<{
  (e: 'select', difficulty: Difficulty): void;
  (e: 'back'): void;
}>();

const selected = ref<Difficulty>(props.current);

function choose(d: Difficulty) {
  selected.value = d;
  emit('select', d);
}
</script>

<template>
  <div class="panel">
    <h1 class="title">难度选择</h1>
    <p class="subtitle">电脑坦克的智能程度</p>
    <div class="option-row">
      <button
        v-for="(label, key) in DIFFICULTY_LABELS"
        :key="key"
        class="option"
        :class="{ active: selected === key }"
        @click="choose(key as Difficulty)"
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