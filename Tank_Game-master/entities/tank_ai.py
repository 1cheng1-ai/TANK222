import math
import random
import pygame
from pygame.sprite import spritecollide
from geometry import clamp_to_screen
from direction import quantize_angle
from entities.tank import Tank
from entities.explosion import Explosion


class TankAI(Tank):
    def __init__(self, initial_pos, cfg):
        Tank.__init__(self, initial_pos, cfg)

    def update(self, shell_list=None, player_pos=None):
        random_move = random.choice(self.cfg.ai_action_set)
        if random_move == 'left':
            self._rotate(-self.cfg.rotation_step)
        elif random_move == 'right':
            self._rotate(self.cfg.rotation_step)

        self._move()

        if self.rect.left <= 0:
            self._rotate(self.cfg.rotation_step)
        elif self.rect.right >= self.cfg.screen_width:
            self._rotate(-self.cfg.rotation_step)
        if self.rect.top <= 0:
            self._rotate(-self.cfg.rotation_step)
        elif self.rect.bottom >= self.cfg.screen_height:
            self._rotate(-self.cfg.rotation_step)

        self.rect = clamp_to_screen(self.rect, self.cfg)
        self.turret.update(self.rect.center, self.rotation_counter)

        self._decide_shoot(player_pos)

        if shell_list is not None:
            hit = spritecollide(self, shell_list, True)
            if hit:
                explosion = Explosion(self.rect.center)
                self._spawn_explosion(explosion)
                self.kill()

    def _decide_shoot(self, player_pos):
        if player_pos is None:
            return
        if random.random() >= self.cfg.ai_shoot_probability:
            return
        dx = player_pos[0] - self.rect.centerx
        dy = player_pos[1] - self.rect.centery
        angle = math.degrees(math.atan2(dy, dx)) + 90
        quantized = quantize_angle(angle)
        self.turret.rotation_offset = quantized - self.rotation_counter
        self.turret.is_shooting = True

    def _spawn_explosion(self, explosion):
        self._pending_explosion = explosion

    @property
    def pending_explosion(self):
        explosion = getattr(self, '_pending_explosion', None)
        if explosion is not None:
            self._pending_explosion = None
        return explosion