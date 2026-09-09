import pygame
from enum import Enum


class MatchState(Enum):
    PLAYING = 0
    WIN = 1
    FAIL = 2


class Renderer:
    def __init__(self, screen, cfg):
        self.screen = screen
        self.cfg = cfg
        self.font = pygame.font.Font(None, 36) if pygame.font else None
        self.big_font = pygame.font.Font(None, 72) if pygame.font else None

    def render(self, background, shells, tanks, turrets, flashes, explosions, hud_text=None):
        self.screen.blit(background, (0, 0))

        shells.draw(self.screen)

        tanks.draw(self.screen)

        turrets.draw(self.screen)

        for flash in flashes:
            if flash is not None:
                self.screen.blit(flash[0], flash[1])

        explosions.draw(self.screen)

        if self.font and hud_text is not None:
            text = self.font.render(str(hud_text), True, (10, 10, 10))
            textpos = text.get_rect(centerx=self.screen.get_width() // 2)
            self.screen.blit(text, textpos)

        pygame.display.update()

    def render_end_screen(self, result):
        self.screen.fill(self.cfg.background_color)

        if result == MatchState.WIN:
            title = "胜利！" if self.big_font else "WIN"
            color = (0, 180, 0)
        else:
            title = "游戏失败" if self.big_font else "FAIL"
            color = (200, 0, 0)

        if self.big_font:
            title_text = self.big_font.render(title, True, color)
            title_pos = title_text.get_rect(center=(self.screen.get_width() // 2,
                                                     self.screen.get_height() // 2 - 30))
            self.screen.blit(title_text, title_pos)

        if self.font:
            restart_text = self.font.render(self.cfg.end_screen_restart_text, True, (10, 10, 10))
            restart_pos = restart_text.get_rect(center=(self.screen.get_width() // 2,
                                                        self.screen.get_height() // 2 + 30))
            self.screen.blit(restart_text, restart_pos)

            quit_text = self.font.render(self.cfg.end_screen_quit_text, True, (10, 10, 10))
            quit_pos = quit_text.get_rect(center=(self.screen.get_width() // 2,
                                                   self.screen.get_height() // 2 + 70))
            self.screen.blit(quit_text, quit_pos)

        pygame.display.update()