import pygame
from sprite_sheet import SpriteStripAnim


class Explosion(pygame.sprite.Sprite):
    def __init__(self, initial_pos):
        pygame.sprite.Sprite.__init__(self)
        try:
            anim = SpriteStripAnim('Explode3.bmp', (0, 0, 48, 48), 4, -1, True, 10)
            anim = anim + SpriteStripAnim('Explode3.bmp', (48, 48, 48, 48), 4, -1, True, 10)
            self._anim = iter(anim)
            self.image = next(self._anim)
            self.rect = self.image.get_rect()
            self.rect.center = initial_pos
        except (SystemExit, pygame.error, StopIteration):
            self.kill()
            self.image = pygame.Surface((1, 1))
            self.rect = self.image.get_rect()
            self._anim = None

    def update(self):
        if self._anim is None:
            self.kill()
            return
        try:
            self.image = next(self._anim)
        except StopIteration:
            self.kill()