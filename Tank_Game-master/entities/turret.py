import pygame
from resources import load_images
from direction import select_image, normalize_offset
from entities.shell import Shell


class Turret(pygame.sprite.Sprite):
    def __init__(self, initial_pos, cfg):
        pygame.sprite.Sprite.__init__(self)
        self.images = load_images(
            ['Turret1.bmp', 'Turret2.bmp', 'Turret3.bmp', 'Turret4.bmp'], -1)
        self.flash_images = load_images(
            ['Fire1.bmp', 'Fire2.bmp', 'Fire3.bmp', 'Fire4.bmp'], -1)
        self._flash = None
        self.image = self.images[0]
        self.rect = self.image.get_rect()
        self.rect.center = initial_pos
        self.rotation_counter = 0
        self.rotation_offset = 0
        self.is_shooting = False
        self.shells = pygame.sprite.Group()
        self.cfg = cfg

    @property
    def flash(self):
        return self._flash

    def update(self, center, chassis_rotation, action=None):
        if action == 'tRight':
            self.rotation_offset += self.cfg.rotation_step
        elif action == 'tLeft':
            self.rotation_offset -= self.cfg.rotation_step
        self.rotation_offset = normalize_offset(self.rotation_offset)
        self.rotation_counter = chassis_rotation + self.rotation_offset
        self.rect.center = center
        self.image = select_image(self.rotation_counter, self.images)
        if self.is_shooting:
            self._shoot()

    def _shoot(self):
        self._flash = select_image(self.rotation_counter, self.flash_images)
        shell = Shell(self.rect.center, self.rotation_counter, self.cfg)
        self.shells.add(shell)
        self.is_shooting = False

    def clear_flash(self):
        self._flash = None