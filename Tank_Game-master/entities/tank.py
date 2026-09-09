import pygame
from pygame.locals import K_UP, K_DOWN, K_LEFT, K_RIGHT, K_a, K_d, K_SPACE
from resources import load_images
from direction import move_vector, select_image, normalize_rotation
from geometry import clamp_to_screen
from entities.turret import Turret


class Tank(pygame.sprite.Sprite):
    def __init__(self, initial_pos, cfg):
        pygame.sprite.Sprite.__init__(self)
        self.images = load_images(
            ['TankBase1.bmp', 'TankBase2.bmp', 'TankBase3.bmp', 'TankBase4.bmp'], -1)
        self.image = self.images[0]
        self.rect = self.image.get_rect()
        self.rect.center = initial_pos
        self.turret = Turret(initial_pos, cfg)
        self.rotation_counter = 0
        self.cfg = cfg

    def update(self, pressed=None):
        if pressed is not None:
            if pressed[K_UP]:
                self._move()
            if pressed[K_DOWN]:
                self._reverse()
            if pressed[K_LEFT]:
                self._rotate(-self.cfg.rotation_step)
            if pressed[K_RIGHT]:
                self._rotate(self.cfg.rotation_step)

            action = None
            if pressed[K_a]:
                action = 'tLeft'
            elif pressed[K_d]:
                action = 'tRight'
            if pressed[K_SPACE]:
                self.turret.is_shooting = True

            self.rect = clamp_to_screen(self.rect, self.cfg)
            self.turret.update(self.rect.center, self.rotation_counter, action)

    def _move(self):
        dx, dy = move_vector(self.rotation_counter, self.cfg.tank_speed)
        self.rect.move_ip(dx, dy)

    def _reverse(self):
        dx, dy = move_vector(self.rotation_counter, self.cfg.tank_speed)
        self.rect.move_ip(-dx, -dy)

    def _rotate(self, step):
        self.rotation_counter = normalize_rotation(self.rotation_counter + step)
        self.image = select_image(self.rotation_counter, self.images)