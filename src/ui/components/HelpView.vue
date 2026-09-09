<script setup lang="ts">
defineEmits<{
  (e: 'back'): void;
}>();
</script>

<template>
  <div class="panel">
    <h1 class="title">游戏说明</h1>
    <p class="subtitle">操作与规则</p>

    <div class="help-section">
      <h3>玩家1 操作</h3>
      <ul>
        <li>移动：<span class="key">↑</span><span class="key">↓</span><span class="key">←</span><span class="key">→</span></li>
        <li>发射：<span class="key">空格</span></li>
      </ul>
    </div>

    <div class="help-section">
      <h3>玩家2 操作（双人对战）</h3>
      <ul>
        <li>移动：<span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span></li>
        <li>发射：<span class="key">回车</span></li>
      </ul>
    </div>

    <div class="help-section">
      <h3>游戏目标</h3>
      <p>摧毁对方坦克或基地即可获胜。坦克生命值耗尽或基地被毁则失败。</p>
    </div>

    <div class="help-section">
      <h3>障碍物</h3>
      <ul>
        <li>砖墙：可被炮弹摧毁</li>
        <li>钢墙：无法摧毁，需绕行</li>
      </ul>
    </div>

    <button class="btn primary" @click="$emit('back')">返回主菜单</button>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';
</style>