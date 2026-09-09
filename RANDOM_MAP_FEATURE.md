# TANK222 - 随机地图功能

## 功能概述

为 TANK222 坦克大战游戏新增了多地图选择和随机地图生成功能：

- **3 张预设地图**：经典战场、开阔竞技场、堡垒攻防
- **随机地图生成**：支持小型(18×18)、中型(26×26)、大型(32×32)三种尺寸
- **地图选择界面**：主菜单新增"选择地图"入口，可选择预设或随机地图
- **对称布局**：随机地图采用上下对称设计，保证游戏公平性
- **基地护卫**：所有地图自动为基地生成砖块+钢块护卫
- **出生点保护**：随机生成时确保坦克出生点周围有足够活动空间

## 修改文件清单

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `src/config/MazeGenerator.ts` | **新增** | 随机地图生成器 |
| `src/config/mapPresets.ts` | **新增** | 预设地图集合 + 配置工厂函数 |
| `src/ui/components/MapSelectView.vue` | **新增** | 地图选择界面 |
| `src/engine/BattleScene.ts` | 修改 | 支持自定义地图配置 |
| `src/engine/GameEngine.ts` | 修改 | 添加 setCustomMap / goToMapSelect |
| `src/types/common.ts` | 修改 | 添加 `mapSelect` 游戏阶段 |
| `src/ui/components/MainMenuView.vue` | 修改 | 添加"选择地图"按钮 |
| `src/App.vue` | 修改 | 集成地图选择流程 |

## 启动方式

```bash
npm install
npm run dev
```

浏览器访问：`http://localhost:5173/index.html`

---

## 完整文件内容

### 1. `src/config/MazeGenerator.ts`（新增）

```typescript
import type { MapConfig, ObstacleSeed } from './types';
import type { GridPos } from '@/types/geometry';

export type MazeSize = 'small' | 'medium' | 'large';

interface SizeSpec {
  cols: number;
  rows: number;
  brickDensity: number;
  steelCount: number;
}

const SIZE_SPECS: Record<MazeSize, SizeSpec> = {
  small: { cols: 18, rows: 18, brickDensity: 0.28, steelCount: 4 },
  medium: { cols: 26, rows: 26, brickDensity: 0.32, steelCount: 8 },
  large: { cols: 32, rows: 32, brickDensity: 0.34, steelCount: 12 }
};

function brick(col: number, row: number): ObstacleSeed {
  return { pos: { col, row }, type: 'brick' };
}

function steel(col: number, row: number): ObstacleSeed {
  return { pos: { col, row }, type: 'steel' };
}

function buildBaseGuard(col: number, row: number): ObstacleSeed[] {
  return [
    brick(col - 1, row - 1),
    brick(col, row - 1),
    brick(col + 1, row - 1),
    brick(col - 1, row),
    brick(col + 1, row),
    steel(col - 1, row + 1),
    steel(col, row + 1),
    steel(col + 1, row + 1)
  ];
}

function isNearSpawn(pos: GridPos, spawns: GridPos[], radius: number): boolean {
  for (const s of spawns) {
    if (Math.abs(pos.col - s.col) <= radius && Math.abs(pos.row - s.row) <= radius) {
      return true;
    }
  }
  return false;
}

function generateRandomObstacles(spec: SizeSpec, spawns: GridPos[]): ObstacleSeed[] {
  const obstacles: ObstacleSeed[] = [];
  const centerRow = Math.floor(spec.rows / 2);
  const occupied = new Set<string>();
  const key = (c: number, r: number) => `${c},${r}`;

  for (const s of spawns) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        occupied.add(key(s.col + dc, s.row + dr));
      }
    }
  }

  for (let row = 3; row < centerRow; row += 2) {
    for (let col = 3; col < spec.cols - 3; col += 2) {
      if (Math.random() < spec.brickDensity) {
        const positions: GridPos[] = [
          { col, row },
          { col: col + 1, row },
          { col, row: row + 1 },
          { col: col + 1, row: row + 1 }
        ];
        const mirrorRow = spec.rows - 1 - row;
        const allPositions = [
          ...positions,
          ...positions.map((p) => ({ col: p.col, row: mirrorRow + (p.row - row) }))
        ];
        let blocked = false;
        for (const p of allPositions) {
          if (occupied.has(key(p.col, p.row)) || isNearSpawn(p, spawns, 3)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          for (const p of allPositions) {
            obstacles.push(brick(p.col, p.row));
            occupied.add(key(p.col, p.row));
          }
        }
      }
    }
  }

  for (let i = 0; i < spec.steelCount; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const col = 3 + Math.floor(Math.random() * (spec.cols - 6));
      const row = 3 + Math.floor(Math.random() * (spec.rows - 6));
      const mirrorRow = spec.rows - 1 - row;
      if (!occupied.has(key(col, row)) && !occupied.has(key(col, mirrorRow)) &&
          !isNearSpawn({ col, row }, spawns, 3) && !isNearSpawn({ col, row: mirrorRow }, spawns, 3)) {
        obstacles.push(steel(col, row));
        obstacles.push(steel(col, mirrorRow));
        occupied.add(key(col, row));
        occupied.add(key(col, mirrorRow));
        break;
      }
    }
  }

  return obstacles;
}

export function generateRandomMap(size: MazeSize = 'medium'): MapConfig {
  const spec = SIZE_SPECS[size];
  const player1Pos: GridPos = { col: 1, row: spec.rows - 2 };
  const player2Pos: GridPos = { col: spec.cols - 2, row: spec.rows - 2 };
  const computerPos: GridPos = { col: Math.floor(spec.cols / 2), row: 1 };

  const spawns: GridPos[] = [player1Pos, player2Pos, computerPos];

  const obstacles = [
    ...generateRandomObstacles(spec, spawns),
    ...buildBaseGuard(player1Pos.col, player1Pos.row),
    ...buildBaseGuard(player2Pos.col, player2Pos.row),
    ...buildBaseGuard(computerPos.col, computerPos.row)
  ];

  return {
    cols: spec.cols,
    rows: spec.rows,
    obstacles,
    tanks: [
      { faction: 'player1', pos: player1Pos },
      { faction: 'player2', pos: player2Pos },
      { faction: 'computer', pos: computerPos }
    ],
    bases: [
      { faction: 'player1', pos: player1Pos },
      { faction: 'player2', pos: player2Pos },
      { faction: 'computer', pos: computerPos }
    ]
  };
}

export function generateMapVariants(count: number, size: MazeSize = 'medium'): MapConfig[] {
  const variants: MapConfig[] = [];
  for (let i = 0; i < count; i++) {
    variants.push(generateRandomMap(size));
  }
  return variants;
}
```

### 2. `src/config/mapPresets.ts`（新增）

```typescript
import type { MapConfig, IGameConfig } from './types';
import { mapConfig as classicMap } from './map.config';
import { generateRandomMap, type MazeSize } from './MazeGenerator';
import { difficultyConfig } from './difficulty.config';
import { tankConfig } from './tank.config';

export interface MapPreset {
  id: string;
  name: string;
  description: string;
  map: MapConfig;
}

function brick(col: number, row: number) {
  return { pos: { col, row }, type: 'brick' as const };
}

function steel(col: number, row: number) {
  return { pos: { col, row }, type: 'steel' as const };
}

function buildBaseGuard(col: number, row: number) {
  return [
    brick(col - 1, row - 1), brick(col, row - 1), brick(col + 1, row - 1),
    brick(col - 1, row), brick(col + 1, row),
    steel(col - 1, row + 1), steel(col, row + 1), steel(col + 1, row + 1)
  ];
}

const openArena: MapConfig = {
  cols: 20,
  rows: 20,
  obstacles: [
    ...buildBaseGuard(1, 18),
    ...buildBaseGuard(18, 18),
    ...buildBaseGuard(10, 1),
    brick(5, 5), brick(6, 5), brick(5, 6), brick(6, 6),
    brick(13, 5), brick(14, 5), brick(13, 6), brick(14, 6),
    brick(5, 13), brick(6, 13), brick(5, 14), brick(6, 14),
    brick(13, 13), brick(14, 13), brick(13, 14), brick(14, 14),
    steel(9, 9), steel(10, 9), steel(9, 10), steel(10, 10)
  ],
  tanks: [
    { faction: 'player1', pos: { col: 1, row: 18 } },
    { faction: 'player2', pos: { col: 18, row: 18 } },
    { faction: 'computer', pos: { col: 10, row: 1 } }
  ],
  bases: [
    { faction: 'player1', pos: { col: 1, row: 18 } },
    { faction: 'player2', pos: { col: 18, row: 18 } },
    { faction: 'computer', pos: { col: 10, row: 1 } }
  ]
};

const fortress: MapConfig = {
  cols: 26,
  rows: 26,
  obstacles: [
    ...buildBaseGuard(1, 24),
    ...buildBaseGuard(24, 24),
    ...buildBaseGuard(13, 1),
    ...(() => {
      const obs: typeof brick[] = [];
      for (let c = 4; c < 22; c += 4) {
        obs.push(brick(c, 8), brick(c + 1, 8), brick(c, 9), brick(c + 1, 9));
        obs.push(brick(c, 16), brick(c + 1, 16), brick(c, 17), brick(c + 1, 17));
      }
      for (let r = 10; r < 16; r += 2) {
        obs.push(brick(8, r), brick(8, r + 1), brick(17, r), brick(17, r + 1));
      }
      obs.push(steel(12, 12), steel(13, 12), steel(12, 13), steel(13, 13));
      return obs;
    })()
  ],
  tanks: [
    { faction: 'player1', pos: { col: 1, row: 24 } },
    { faction: 'player2', pos: { col: 24, row: 24 } },
    { faction: 'computer', pos: { col: 13, row: 1 } }
  ],
  bases: [
    { faction: 'player1', pos: { col: 1, row: 24 } },
    { faction: 'player2', pos: { col: 24, row: 24 } },
    { faction: 'computer', pos: { col: 13, row: 1 } }
  ]
};

export const presetMaps: MapPreset[] = [
  { id: 'classic', name: '经典战场', description: '26×26 对称经典布局', map: classicMap },
  { id: 'arena', name: '开阔竞技场', description: '20×20 稀疏障碍', map: openArena },
  { id: 'fortress', name: '堡垒攻防', description: '26×26 要塞结构', map: fortress }
];

export function getPresetById(id: string): MapConfig | null {
  const preset = presetMaps.find((p) => p.id === id);
  return preset ? preset.map : null;
}

export function createGameConfig(map: MapConfig): IGameConfig {
  return {
    map,
    difficulties: difficultyConfig,
    tank: tankConfig
  };
}

export function createPresetConfig(presetId: string): IGameConfig {
  const map = getPresetById(presetId) ?? classicMap;
  return createGameConfig(map);
}

export function createRandomConfig(size: MazeSize = 'medium'): IGameConfig {
  const map = generateRandomMap(size);
  return createGameConfig(map);
}

export { generateRandomMap, type MazeSize };
```

### 3. `src/ui/components/MapSelectView.vue`（新增）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { presetMaps, createPresetConfig, createRandomConfig, type MazeSize } from '@/config/mapPresets';
import type { IGameConfig } from '@/config';

const emit = defineEmits<{
  (e: 'select', config: IGameConfig): void;
  (e: 'back'): void;
}>();

type SelectType = 'preset' | 'random';

const selectedType = ref<SelectType>('preset');
const selectedId = ref<string>('classic');
const selectedSize = ref<MazeSize>('medium');

const sizeOptions: { value: MazeSize; label: string }[] = [
  { value: 'small', label: '小型 18×18' },
  { value: 'medium', label: '中型 26×26' },
  { value: 'large', label: '大型 32×32' }
];

function selectPreset(id: string) {
  selectedType.value = 'preset';
  selectedId.value = id;
}

function selectRandom(size: MazeSize) {
  selectedType.value = 'random';
  selectedSize.value = size;
}

function handleConfirm() {
  let config: IGameConfig;
  if (selectedType.value === 'preset') {
    config = createPresetConfig(selectedId.value);
  } else {
    config = createRandomConfig(selectedSize.value);
  }
  emit('select', config);
}
</script>

<template>
  <div class="panel">
    <h1 class="title">选择地图</h1>
    <p class="subtitle">预设战场 · 随机生成</p>

    <div class="map-grid">
      <button
        v-for="preset in presetMaps"
        :key="preset.id"
        :class="['map-card', { active: selectedType === 'preset' && selectedId === preset.id }]"
        @click="selectPreset(preset.id)"
      >
        <div class="map-name">{{ preset.name }}</div>
        <div class="map-desc">{{ preset.description }}</div>
      </button>
    </div>

    <div class="random-section">
      <div class="label">随机地图</div>
      <div class="option-row">
        <button
          v-for="sz in sizeOptions"
          :key="sz.value"
          :class="['option', { active: selectedType === 'random' && selectedSize === sz.value }]"
          @click="selectRandom(sz.value)"
        >
          {{ sz.label }}
        </button>
      </div>
    </div>

    <button class="btn primary" @click="handleConfirm">确认选择</button>
    <button class="btn ghost" @click="emit('back')">返回主菜单</button>
  </div>
</template>

<style scoped>
@import '../styles/panel.css';

.map-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.map-card {
  padding: 16px 14px;
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.map-card:hover {
  background: rgba(51, 65, 85, 0.6);
  border-color: rgba(148, 163, 184, 0.4);
}

.map-card.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.55), rgba(37, 99, 235, 0.4));
  border-color: rgba(147, 197, 253, 0.7);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.map-name {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.map-desc {
  font-size: 12px;
  color: #94a3b8;
}

.random-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.3);
  border: 1px dashed rgba(148, 163, 184, 0.2);
  border-radius: 12px;
}
</style>
```

### 4. `src/types/common.ts`（修改 — 仅 GamePhase 部分）

```typescript
export type GamePhase =
  | 'mainMenu'
  | 'mapSelect'        // ← 新增
  | 'modeSelect'
  | 'difficultySelect'
  | 'help'
  | 'battle'
  | 'result';
```

### 5. `src/engine/BattleScene.ts`（修改 — 关键部分）

构造函数新增可选参数 `customMap`：

```typescript
import type { MapConfig } from '@/config';

// 新增属性
private customMap: MapConfig | null = null;

constructor(mode: BattleMode, difficulty: Difficulty | null, customMap?: MapConfig) {
  this.mode = mode;
  this.difficulty = difficulty;
  this.customMap = customMap ?? null;
  const map = customMap ?? gameConfig.map;
  this.cols = map.cols;
  this.rows = map.rows;
  this.entities = new EntityManager();
  this.collisions = new CollisionSystem(this.cols, this.rows);
  this.judge = new JudgeSystem(mode);
  this.buildScene();
}

private buildScene(): void {
  resetIds();
  const map = this.customMap ?? gameConfig.map;
  const { tank } = gameConfig;
  // ... 后续使用 map 而非 gameConfig.map
}
```

### 6. `src/engine/GameEngine.ts`（修改 — 关键部分）

```typescript
import type { MapConfig } from '@/config';

// 新增属性
private customMap: MapConfig | null = null;

// 新增方法
setCustomMap(map: MapConfig | null): void {
  this.customMap = map;
}

goToMapSelect(): void {
  this.fsm.transitionTo('mapSelect');
}

// 修改 beginBattle 使用自定义地图
beginBattle(): void {
  try {
    this.result = null;
    this.error = null;
    const difficulty = this.selectedMode === 'pve' ? this.selectedDifficulty : null;
    this.scene = new BattleScene(this.selectedMode, difficulty, this.customMap ?? undefined);
    this.setupInputBindings();
    this.fsm.transitionTo('battle');
    this.startLoop();
  } catch (e) {
    this.error = `开始对战失败: ${(e as Error).message}`;
    this.emitState(this.fsm.get());
  }
}
```

### 7. `src/ui/components/MainMenuView.vue`（修改）

新增 `map` 事件和"选择地图"按钮：

```vue
<script setup lang="ts">
defineEmits<{
  (e: 'start'): void;
  (e: 'map'): void;       // ← 新增
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
    <button class="btn" @click="$emit('map')">选择地图</button>
    <button class="btn" @click="$emit('mode')">对战模式</button>
    <button class="btn" @click="$emit('difficulty')">难度选择</button>
    <button class="btn ghost" @click="$emit('help')">游戏说明</button>
  </div>
</template>
```

### 8. `src/App.vue`（修改 — 关键部分）

```vue
<script setup lang="ts">
import MapSelectView from '@/ui/components/MapSelectView.vue';
import type { IGameConfig, MapConfig } from '@/config';

// 新增
const showMapSelect = computed(() => state.value.phase === 'mapSelect');

function handleMap() {
  engine.goToMapSelect();
}

function handleMapSelect(config: IGameConfig) {
  engine.setCustomMap(config.map as MapConfig);
  engine.beginBattle();
}
</script>

<template>
  <MainMenuView v-if="showMenu" @start="handleStart" @map="handleMap" ... />
  <MapSelectView v-else-if="showMapSelect" @select="handleMapSelect" @back="handleBack" />
  <!-- ... 其他视图 -->
</template>
```

---

## 随机地图生成算法说明

### 生成流程

1. **确定尺寸**：根据选择的小/中/大确定网格大小和障碍密度
2. **设置出生点**：player1左下角、player2右下角、computer上中
3. **保护出生区域**：出生点周围5×5范围标记为占用，不放置障碍
4. **对称放置砖块**：在上半部分随机生成2×2砖块群，镜像到下半部分
5. **随机放置钢块**：成对放置（上下对称），作为坚固掩体
6. **添加基地护卫**：为每个基地生成标准的砖块+钢块护卫结构

### 尺寸规格

| 尺寸 | 网格大小 | 砖块密度 | 钢块数量 |
|------|---------|---------|---------|
| 小型 | 18×18 | 28% | 4 |
| 中型 | 26×26 | 32% | 8 |
| 大型 | 32×32 | 34% | 12 |

### 预设地图列表

| ID | 名称 | 大小 | 特点 |
|----|------|------|------|
| classic | 经典战场 | 26×26 | 原版对称布局 |
| arena | 开阔竞技场 | 20×20 | 四角砖块+中心钢块 |
| fortress | 堡垒攻防 | 26×26 | 双层城墙+中心要塞 |

## 项目结构

```
src/
├── config/
│   ├── index.ts              # 游戏配置入口
│   ├── map.config.ts         # 原版地图
│   ├── MazeGenerator.ts      # 【新增】随机地图生成器
│   ├── mapPresets.ts         # 【新增】预设地图 + 配置工厂
│   ├── difficulty.config.ts
│   ├── tank.config.ts
│   └── types.ts
├── engine/
│   ├── BattleScene.ts        # 【修改】支持自定义地图
│   ├── GameEngine.ts         # 【修改】setCustomMap + goToMapSelect
│   └── ...
├── types/
│   └── common.ts             # 【修改】添加 mapSelect 阶段
├── ui/
│   └── components/
│       ├── MainMenuView.vue  # 【修改】添加选择地图按钮
│       ├── MapSelectView.vue # 【新增】地图选择界面
│       └── ...
└── App.vue                   # 【修改】集成地图选择流程
```

## 技术栈

- **Vue 3** + **TypeScript** + **Vite**
- Canvas 2D 渲染
- 状态机驱动游戏流程
- AI 控制器（PVE 模式）