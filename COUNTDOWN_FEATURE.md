# TANK222 - 120秒倒计时功能

## 功能概述

为 TANK222 坦克大战游戏添加了 120 秒倒计时功能：

- 对战开始后显示 `02:00` 倒计时
- **时间显示在页面最上方**，不遮挡游戏画面（独立栏，位于 canvas 上方）
- 剩余 30 秒以下时倒计时条变红并闪烁警告
- 时间到时自动结束游戏，根据存活情况判定胜负（双方都存活则平局）
- 时间格式为 `MM:SS`，实时更新

## 修改文件清单

| 文件路径 | 修改说明 |
|---------|----------|
| `src/engine/BattleScene.ts` | 添加倒计时属性、递减逻辑、超时判定、快照输出 |
| `src/engine/JudgeSystem.ts` | 新增 `checkTimeout()` 方法处理时间到时的胜负判定 |
| `src/engine/GameEngine.ts` | 新增 `getRemainingTimeMs()` 方法供 UI 获取剩余时间 |
| `src/ui/components/BattleView.vue` | 页面顶部添加倒计时显示栏（不遮挡 canvas） |

## 启动方式

```bash
npm install
npm run dev
```

浏览器访问：`http://localhost:5173/index.html`

---

## 完整文件内容

### 1. `src/engine/BattleScene.ts`

```typescript
import type { BattleMode, Difficulty, Faction } from '@/types/common';
import type { GameResult } from '@/types/result';
import type { TankId, Vec2 } from '@/types/geometry';
import { resetIds } from '@/types/geometry';
import { gameConfig } from '@/config';
import { Tank } from '@/entities/Tank';
import { Bullet } from '@/entities/Bullet';
import { Obstacle } from '@/entities/Obstacle';
import { Base } from '@/entities/Base';
import { Explosion } from '@/entities/Explosion';
import { EntityManager } from './EntityManager';
import { CollisionSystem } from './CollisionSystem';
import { JudgeSystem } from './JudgeSystem';
import { AIController } from '@/ai/AIController';
import { DifficultyProfileProvider } from '@/ai/DifficultyProfile';
import type { ICanvasRenderer } from '@/render/CanvasRenderer';
import type { PlayerCommand } from '@/input/types';

export interface BattleSnapshot {
  tanks: { faction: Faction; hp: number; maxHp: number; alive: boolean }[];
  bases: { faction: Faction; destroyed: boolean }[];
  remainingTimeMs: number;
}

export const ROUND_DURATION_MS = 120000;

export class BattleScene {
  readonly cols: number;
  readonly rows: number;
  readonly mode: BattleMode;
  readonly difficulty: Difficulty | null;
  private entities: EntityManager;
  private collisions: CollisionSystem;
  private judge: JudgeSystem;
  private ai: AIController | null = null;
  private computerTankId: TankId | null = null;
  private player1TankId: TankId | null = null;
  private player2TankId: TankId | null = null;
  private elapsedMs = 0;
  private killCount = 0;
  private remainingTimeMs = ROUND_DURATION_MS;
  private timedOut = false;

  constructor(mode: BattleMode, difficulty: Difficulty | null) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.cols = gameConfig.map.cols;
    this.rows = gameConfig.map.rows;
    this.entities = new EntityManager();
    this.collisions = new CollisionSystem(this.cols, this.rows);
    this.judge = new JudgeSystem(mode);
    this.buildScene();
  }

  private buildScene(): void {
    resetIds();
    const { map, tank } = gameConfig;

    for (const seed of map.obstacles) {
      this.entities.addObstacle(new Obstacle(seed.pos, seed.type));
    }
    for (const seed of map.bases) {
      this.entities.addBase(new Base(seed.faction, seed.pos));
    }

    for (const spawn of map.tanks) {
      const isComputer = spawn.faction === 'computer';
      if (isComputer && this.mode === 'pvp') continue;
      if (spawn.faction === 'player2' && this.mode === 'pve') continue;

      const pos: Vec2 = { x: spawn.pos.col + 0.5, y: spawn.pos.row + 0.5 };
      const hp = isComputer ? tank.computerHp : tank.playerHp;
      const initialDir = isComputer ? 'down' : 'up';
      const tankEntity = new Tank(
        spawn.faction,
        pos,
        initialDir,
        hp,
        tank.fireCooldownMs,
        tank.moveSpeed,
        tank.bulletSpeed
      );
      this.entities.addTank(tankEntity);

      if (spawn.faction === 'player1') this.player1TankId = tankEntity.id;
      if (spawn.faction === 'player2') this.player2TankId = tankEntity.id;
      if (isComputer) this.computerTankId = tankEntity.id;
    }

    if (this.mode === 'pve' && this.difficulty) {
      const profile = DifficultyProfileProvider.get(this.difficulty);
      this.ai = new AIController(this.difficulty, profile);
    }
  }

  getPlayer1TankId(): TankId | null {
    return this.player1TankId;
  }

  getPlayer2TankId(): TankId | null {
    return this.player2TankId;
  }

  getComputerTankId(): TankId | null {
    return this.computerTankId;
  }

  update(deltaMs: number, commands: PlayerCommand[]): void {
    this.elapsedMs += deltaMs;

    if (this.remainingTimeMs > 0) {
      this.remainingTimeMs -= deltaMs;
      if (this.remainingTimeMs <= 0) {
        this.remainingTimeMs = 0;
        this.timedOut = true;
      }
    }

    this.applyCommands(commands);
    if (this.ai) {
      this.applyAI(deltaMs);
    }

    this.updateTanks(deltaMs);
    this.updateBullets(deltaMs);

    const aliveBullets = this.entities.getAliveBullets();
    const aliveTanks = this.entities.getAliveTanks();
    const result = this.collisions.resolve(
      aliveBullets,
      aliveTanks,
      this.entities.obstacles,
      this.entities.bases
    );

    for (const explosion of result.newExplosions) {
      this.entities.addExplosion(explosion);
    }
    for (const killed of result.killedTanks) {
      this.killCount += 1;
      this.judge.recordKill();
      void killed;
    }

    for (const explosion of this.entities.explosions) {
      explosion.advance(deltaMs);
    }

    for (const tank of this.entities.tanks) {
      tank.tickCooldown(deltaMs);
    }

    this.entities.gc();
  }

  private applyCommands(commands: PlayerCommand[]): void {
    for (const cmd of commands) {
      const tank = this.entities.tanks.find((t) => t.id === cmd.tankId);
      if (!tank || !tank.alive) continue;
      switch (cmd.action.kind) {
        case 'move':
          tank.setDirection(cmd.action.direction);
          break;
        case 'fire': {
          const bullet = tank.fire();
          if (bullet) {
            this.entities.addBullet(bullet);
          }
          break;
        }
        case 'idle':
          break;
      }
    }
  }

  private applyAI(deltaMs: number): void {
    if (!this.ai || !this.computerTankId) return;
    const tank = this.entities.tanks.find((t) => t.id === this.computerTankId);
    if (!tank || !tank.alive) return;

    const enemies = this.entities.tanks.filter((t) => t.faction !== 'computer');
    const enemyBases = this.entities.bases.filter((b) => b.faction !== 'computer');
    const otherTanks = this.entities.tanks.filter((t) => t.id !== tank.id);

    const cmd = this.ai.decide(
      {
        tank,
        enemies,
        enemyBases,
        obstacles: this.entities.obstacles,
        otherTanks,
        cols: this.cols,
        rows: this.rows
      },
      this.elapsedMs
    );
    if (!cmd) return;
    void deltaMs;
    this.applyCommands([cmd]);
  }

  private updateTanks(deltaMs: number): void {
    for (const tank of this.entities.tanks) {
      if (!tank.alive) continue;
      const before = { ...tank.position };
      tank.move(deltaMs);
      if (
        !this.collisions.canTankMoveTo(
          tank,
          tank.position,
          this.entities.tanks,
          this.entities.obstacles
        )
      ) {
        tank.position = before;
        this.snapToGrid(tank);
      }
    }
  }

  private snapToGrid(tank: Tank): void {
    tank.position.x = Math.round(tank.position.x - 0.5) + 0.5;
    tank.position.y = Math.round(tank.position.y - 0.5) + 0.5;
  }

  private updateBullets(deltaMs: number): void {
    for (const bullet of this.entities.bullets) {
      if (!bullet.alive) continue;
      bullet.advance(deltaMs);
      if (bullet.isOutOfBounds(this.cols, this.rows)) {
        bullet.destroy();
      }
    }
  }

  render(renderer: ICanvasRenderer): void {
    renderer.clear();
    renderer.drawTerrain();
    for (const obstacle of this.entities.obstacles) {
      renderer.drawObstacle(obstacle);
    }
    for (const base of this.entities.bases) {
      renderer.drawBase(base);
    }
    for (const tank of this.entities.tanks) {
      renderer.drawTank(tank);
    }
    for (const bullet of this.entities.bullets) {
      renderer.drawBullet(bullet);
    }
    for (const explosion of this.entities.explosions) {
      renderer.drawExplosion(explosion);
    }
  }

  checkGameOver(): GameResult | null {
    if (this.timedOut) {
      return this.judge.checkTimeout(this.entities, this.elapsedMs / 1000);
    }
    return this.judge.check(this.entities);
  }

  snapshot(): BattleSnapshot {
    return {
      tanks: this.entities.tanks.map((t) => ({
        faction: t.faction,
        hp: t.hp,
        maxHp: t.maxHp,
        alive: t.alive
      })),
      bases: this.entities.bases.map((b) => ({
        faction: b.faction,
        destroyed: b.destroyed
      })),
      remainingTimeMs: Math.max(0, this.remainingTimeMs)
    };
  }

  getKillCount(): number {
    return this.killCount;
  }

  getElapsedSec(): number {
    return this.elapsedMs / 1000;
  }

  getRemainingTimeMs(): number {
    return Math.max(0, this.remainingTimeMs);
  }

  isTimedOut(): boolean {
    return this.timedOut;
  }

  dispose(): void {
    this.entities.clear();
    this.ai = null;
  }
}

export { Bullet, Explosion };
```

### 2. `src/engine/JudgeSystem.ts`

```typescript
import type { EntityManager } from './EntityManager';
import type { BattleMode, Faction } from '@/types/common';
import type { GameResult } from '@/types/result';

export class JudgeSystem {
  private startTime: number;
  private killCount = 0;
  private mode: BattleMode;

  constructor(mode: BattleMode) {
    this.mode = mode;
    this.startTime = performance.now();
  }

  recordKill(): void {
    this.killCount += 1;
  }

  check(entities: EntityManager): GameResult | null {
    const durationSec = (performance.now() - this.startTime) / 1000;

    if (this.mode === 'pve') {
      const player1Alive = this.isFactionAlive(entities, 'player1');
      const computerAlive = this.isFactionAlive(entities, 'computer');

      if (!player1Alive && !computerAlive) {
        return { winner: 'draw', killCount: this.killCount, durationSec };
      }
      if (!player1Alive) {
        return { winner: 'computer', killCount: this.killCount, durationSec };
      }
      if (!computerAlive) {
        return { winner: 'player1', killCount: this.killCount, durationSec };
      }
      return null;
    }

    const player1Alive = this.isFactionAlive(entities, 'player1');
    const player2Alive = this.isFactionAlive(entities, 'player2');

    if (!player1Alive && !player2Alive) {
      return { winner: 'draw', killCount: this.killCount, durationSec };
    }
    if (!player1Alive) {
      return { winner: 'player2', killCount: this.killCount, durationSec };
    }
    if (!player2Alive) {
      return { winner: 'player1', killCount: this.killCount, durationSec };
    }
    return null;
  }

  checkTimeout(entities: EntityManager, durationSec: number): GameResult {
    if (this.mode === 'pve') {
      const player1Alive = this.isFactionAlive(entities, 'player1');
      const computerAlive = this.isFactionAlive(entities, 'computer');
      if (!player1Alive && !computerAlive) {
        return { winner: 'draw', killCount: this.killCount, durationSec };
      }
      if (!player1Alive) {
        return { winner: 'computer', killCount: this.killCount, durationSec };
      }
      if (!computerAlive) {
        return { winner: 'player1', killCount: this.killCount, durationSec };
      }
      return { winner: 'draw', killCount: this.killCount, durationSec };
    }

    const player1Alive = this.isFactionAlive(entities, 'player1');
    const player2Alive = this.isFactionAlive(entities, 'player2');
    if (!player1Alive && !player2Alive) {
      return { winner: 'draw', killCount: this.killCount, durationSec };
    }
    if (!player1Alive) {
      return { winner: 'player2', killCount: this.killCount, durationSec };
    }
    if (!player2Alive) {
      return { winner: 'player1', killCount: this.killCount, durationSec };
    }
    return { winner: 'draw', killCount: this.killCount, durationSec };
  }

  private isFactionAlive(entities: EntityManager, faction: Faction): boolean {
    const base = entities.getBaseByFaction(faction);
    if (base && base.destroyed) return false;
    const tanks = entities.tanks.filter((t) => t.faction === faction);
    if (tanks.length === 0) return false;
    return tanks.some((t) => t.alive);
  }

  reset(): void {
    this.startTime = performance.now();
    this.killCount = 0;
  }
}
```

### 3. `src/engine/GameEngine.ts`（仅展示新增部分）

在 `getSnapshot()` 方法后新增：

```typescript
  getRemainingTimeMs(): number {
    return this.scene ? this.scene.getRemainingTimeMs() : 0;
  }
```

### 4. `src/ui/components/BattleView.vue`

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, computed } from 'vue';
import type { GameEngine } from '@/engine/GameEngine';

const props = defineProps<{ engine: GameEngine }>();
const emit = defineEmits<{ (e: 'exit'): void }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const remainingMs = ref(120000);
let rafId: number | null = null;

const remainingSec = computed(() => Math.ceil(remainingMs.value / 1000));
const formattedTime = computed(() => {
  const total = remainingSec.value;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});
const isWarning = computed(() => remainingSec.value <= 30);

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Escape') {
    emit('exit');
  }
}

function updateCountdown() {
  remainingMs.value = props.engine.getRemainingTimeMs();
  rafId = requestAnimationFrame(updateCountdown);
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
  updateCountdown();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  props.engine.detachCanvas();
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});
</script>

<template>
  <div class="battle-stage">
    <div :class="['countdown-bar', { warning: isWarning }]">
      <span class="countdown-label">剩余时间</span>
      <span class="countdown-value">{{ formattedTime }}</span>
    </div>
    <div class="battle-wrapper">
      <canvas ref="canvasRef" class="battle-canvas"></canvas>
      <div class="hud">
        <span class="hud-chip">按 ESC 退出对战</span>
        <span class="hud-chip">坦克大战</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';

.battle-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.countdown-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 24px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(96, 165, 250, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e2e8f0;
  font-size: 15px;
  transition: background 0.3s, border-color 0.3s;
}

.countdown-bar.warning {
  background: rgba(127, 29, 29, 0.8);
  border-color: rgba(248, 113, 113, 0.6);
  animation: pulse 1s infinite;
}

.countdown-label {
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 1px;
}

.countdown-bar.warning .countdown-label {
  color: #fca5a5;
}

.countdown-value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: #f1f5f9;
}

.countdown-bar.warning .countdown-value {
  color: #fca5a5;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}
</style>
```

---

## 技术说明

### 倒计时实现原理

1. **BattleScene**：新增 `remainingTimeMs`（初始120000ms）和 `timedOut` 标志，在每帧 `update()` 中递减
2. **JudgeSystem**：新增 `checkTimeout()` 方法，时间到时根据各方存活情况判定胜负（都存活=平局）
3. **GameEngine**：新增 `getRemainingTimeMs()` 暴露剩余时间给 UI 层
4. **BattleView**：使用 `requestAnimationFrame` 轮询引擎剩余时间，在 canvas **上方**独立显示倒计时栏

### UI 布局

```
┌─────────────────────────┐
│    剩余时间  02:00       │  ← 倒计时栏（不遮挡画面）
├─────────────────────────┤
│                         │
│      游戏画面 Canvas      │  ← 游戏区域
│                         │
└─────────────────────────┘
```

倒计时栏使用 `flex-direction: column` 布局，位于 canvas 上方独立区域，完全不遮挡游戏画面。剩余 ≤30 秒时变红并闪烁。

## 技术栈

- **Vue 3** + **TypeScript** + **Vite**
- Canvas 2D 渲染
- 状态机驱动游戏流程
- AI 控制器（PVE 模式）