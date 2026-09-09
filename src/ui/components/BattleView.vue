<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import type { GameEngine } from '@/engine/GameEngine';

const props = defineProps<{ engine: GameEngine }>();
const emit = defineEmits<{ (e: 'exit'): void }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Escape') {
    emit('exit');
  }
}

onMounted(async () => {
  await nextTick();
  if (canvasRef.value) {
    props.engine.attachCanvas(canvasRef.value);
  }
  window.addEventListener('keydown', handleKeydown);
  requestAnimationFrame(() => {
    if (canvasRef.value) {
      props.engine.attachCanvas(canvasRef.value);
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  props.engine.detachCanvas();
});
</script>

<template>
  <div class="battle-wrapper">
    <canvas ref="canvasRef" class="battle-canvas"></canvas>
    <div class="hud">
      <span class="hud-chip">按 ESC 退出对战</span>
      <span class="hud-chip">坦克大战</span>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';
</style>
