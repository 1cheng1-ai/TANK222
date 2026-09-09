# 坦克大战

经典二维平面坦克对战网页游戏，支持人机对战与本地双人对战，画风简洁，纯前端离线运行。

## 技术栈

- **Vue 3** + **Vite 4** + **TypeScript**（严格模式）
- **Canvas 2D** 负责逐帧游戏渲染
- Vue3 负责菜单、结算等离散 UI
- 蓝色渐变背景主题，响应式自适应

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 操作说明

### 玩家1
- 移动：`↑` `↓` `←` `→` 方向键
- 发射：`空格`

### 玩家2（双人对战模式）
- 移动：`W` `A` `S` `D`
- 发射：`回车`

### 通用
- `ESC`：退出对战返回菜单

## 游戏规则

- 摧毁对方坦克或基地即可获胜
- 坦克生命值耗尽或基地被毁则失败
- 砖墙可被炮弹摧毁，钢墙无法摧毁需绕行
- 人机对战有三档难度：简单、普通、困难

## 难度差异

| 难度 | 反应间隔 | 开火概率 | 随机扰动 |
|------|---------|---------|---------|
| 简单 | 800ms | 30% | 40% |
| 普通 | 400ms | 60% | 15% |
| 困难 | 200ms | 90% | 0% |

## 目录结构

```
src/
├── assets/styles/    # 全局样式
├── config/           # 配置层（地图、难度、坦克属性）
├── entities/         # 实体层（Tank、Bullet、Obstacle、Base、Explosion）
├── engine/           # 引擎层（GameLoop、状态机、碰撞、场景、判定）
├── render/           # 渲染层（CanvasRenderer、Camera、SpritePainter）
├── input/            # 输入层（KeyboardInput、CommandBuffer）
├── ai/               # AI 层（AIController、DifficultyProfile）
├── ui/               # UI 层（Vue 组件、样式、类型）
└── types/            # 公共类型定义
```

## 部署

执行 `npm run build` 后，将 `dist/` 目录部署至任意静态文件托管服务（如 Nginx、Vercel、Netlify、GitHub Pages）即可。