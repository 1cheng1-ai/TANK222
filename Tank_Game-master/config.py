from dataclasses import dataclass, field
from typing import Tuple
from pygame.locals import K_r, K_ESCAPE


@dataclass(frozen=True)
class GameConfig:
    screen_width: int = 1024
    screen_height: int = 768
    fps: int = 30
    tank_speed: float = 3.0
    shell_speed: float = 15.0
    rotation_step: int = 30
    ai_initial_count: int = 5
    ai_shoot_probability: float = 0.01
    ai_action_set: Tuple[str, ...] = (
        'left', 'right', '', '', '', '', '', '',
    )
    background_color: Tuple[int, int, int] = (136, 225, 136)
    end_screen_restart_key: int = K_r
    end_screen_quit_key: int = K_ESCAPE
    end_screen_restart_text: str = "按 R 重新开始"
    end_screen_quit_text: str = "按 ESC 退出"

    def __post_init__(self):
        if self.screen_width <= 0 or not isinstance(self.screen_width, int):
            raise ValueError("配置参数非法: screen_width 必须为正整数")
        if self.screen_height <= 0 or not isinstance(self.screen_height, int):
            raise ValueError("配置参数非法: screen_height 必须为正整数")
        if self.fps <= 0 or not isinstance(self.fps, int):
            raise ValueError("配置参数非法: fps 必须为正整数")
        if self.tank_speed <= 0 or not isinstance(self.tank_speed, (int, float)):
            raise ValueError("配置参数非法: tank_speed 必须为正数")
        if self.shell_speed <= 0 or not isinstance(self.shell_speed, (int, float)):
            raise ValueError("配置参数非法: shell_speed 必须为正数")
        if self.rotation_step <= 0 or not isinstance(self.rotation_step, int):
            raise ValueError("配置参数非法: rotation_step 必须为正整数")
        if self.ai_initial_count <= 0 or not isinstance(self.ai_initial_count, int):
            raise ValueError("配置参数非法: ai_initial_count 必须为正整数")
        if not (0 < self.ai_shoot_probability < 1) or not isinstance(self.ai_shoot_probability, (int, float)):
            raise ValueError("配置参数非法: ai_shoot_probability 必须为 (0,1) 区间内小数")
        if not isinstance(self.end_screen_restart_key, int):
            raise ValueError("配置参数非法: 结束画面按键必须为整数键码")
        if not isinstance(self.end_screen_quit_key, int):
            raise ValueError("配置参数非法: 结束画面按键必须为整数键码")
        if not isinstance(self.end_screen_restart_text, str) or not self.end_screen_restart_text:
            raise ValueError("配置参数非法: 结束画面文案必须为非空字符串")
        if not isinstance(self.end_screen_quit_text, str) or not self.end_screen_quit_text:
            raise ValueError("配置参数非法: 结束画面文案必须为非空字符串")