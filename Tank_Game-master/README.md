# Tank_Game

A tank battle game with AI enemies, written in Python 3 and pygame.

## 启动方式

```bash
python main.py
```

或双击 `start_game.bat` 快速启动游戏。

## 模块结构

```
Tank_Game-master/
├── main.py              # 唯一主入口
├── game_loop.py         # 游戏主循环
├── config.py            # 集中配置（GameConfig 冻结数据类）
├── resources.py         # 资源加载（Python 3 语法）
├── direction.py         # 方向工具（移动向量、图像选择、归一）
├── geometry.py          # 边界工具（钳制、越界判定）
├── sprite_sheet.py      # 精灵图切分与动画
├── renderer.py          # 渲染器（统一绘制职责）
├── entities/
│   ├── tank.py          # 玩家坦克
│   ├── tank_ai.py       # AI 坦克
│   ├── turret.py        # 炮塔
│   ├── shell.py         # 炮弹
│   └── explosion.py     # 爆炸特效
├── data/                # 位图资源
├── setup.py             # 历史打包脚本（保留）
├── start_game.bat       # 快速启动脚本
└── README.md
```

## 配置调整

所有可调参数集中在 `config.py` 的 `GameConfig` 中，修改后无需改动业务代码：

- `screen_width` / `screen_height`：窗口尺寸（默认 1024×768）
- `fps`：帧率（默认 30）
- `tank_speed`：坦克移动速度（默认 3.0）
- `shell_speed`：炮弹飞行速度（默认 15.0）
- `rotation_step`：旋转步长（默认 30 度）
- `ai_initial_count`：初始 AI 数量（默认 5）
- `ai_shoot_probability`：AI 射击概率（默认 0.01）
- `background_color`：背景颜色（默认 (136, 225, 136)）

## 游戏规则

- **胜利条件**：消灭所有 AI 坦克
- **失败条件**：玩家被 AI 炮弹击中
- AI 坦克被全部消灭后不再重生
- 游戏结束后显示胜利/失败画面，按 R 重新开始，按 ESC 退出

## 操控说明

- 方向键：控制坦克车体移动与旋转
- A / D：独立旋转炮塔
- 空格：射击
- R：游戏结束后重新开始
- ESC：退出
