import pygame
from resources import load_image
from direction import move_vector
from geometry import is_out_of_screen


class Shell(pygame.sprite.Sprite):
    def __init__(self, initial_pos, rotation, cfg):
        pygame.sprite.Sprite.__init__(self)
        self.image = load_image('shell.bmp', -1)
        self.rect = self.image.get_rect()
        self.rect.center = initial_pos
        self.orientation = rotation
        self.cfg = cfg

    def update(self):
        dx, dy = move_vector(self.orientation, self.cfg.shell_speed)
        self.rect.move_ip(dx, dy)
        if is_out_of_screen(self.rect, self.cfg):
            self.kill()