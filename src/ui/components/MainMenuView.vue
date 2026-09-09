<script setup lang="ts">
defineEmits<{
  (e: 'start'): void;
  (e: 'mode'): void;
  (e: 'difficulty'): void;
  (e: 'help'): void;
}>();
</script>

<template>
  <div class="panel">
    <h1 class="title">坦克大战</h1>
    <p class="subtitle">经典二维对战 · 简单画风</p>
    <button class="btn primary" @click="$emit('start')">开始游戏</button>
    <button class="btn" @click="$emit('mode')">对战模式</button>
    <button class="btn" @click="$emit('difficulty')">难度选择</button>
    <button class="btn ghost" @click="$emit('help')">游戏说明</button>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';
</style>