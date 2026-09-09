import pygame
from resources import load_image


class spritesheet(object):
    def __init__(self, filename):
        self.sheet = load_image(filename)

    def image_at(self, rectangle, colorkey=None):
        rect = pygame.Rect(rectangle)
        image = pygame.Surface(rect.size).convert()
        image.blit(self.sheet, (0, 0), rect)
        if colorkey is not None:
            if colorkey == -1:
                colorkey = image.get_at((5, 5))
            image.set_colorkey(colorkey, pygame.RLEACCEL)
        return image

    def images_at(self, rects, colorkey=None):
        return [self.image_at(rect, colorkey) for rect in rects]

    def load_strip(self, rect, image_count, colorkey=None):
        tups = [(rect[0] + rect[2] * x, rect[1], rect[2], rect[3])
                for x in range(image_count)]
        return self.images_at(tups, colorkey)


class SpriteStripAnim(object):
    def __init__(self, filename, rect, count, colorkey=None, loop=False, frames=1):
        self.filename = filename
        ss = spritesheet(filename)
        self.images = ss.load_strip(rect, count, colorkey)
        self.i = 0
        self.loop = loop
        self.frames = frames
        self.f = frames

    def __iter__(self):
        self.i = 0
        self.f = self.frames
        return self

    def __next__(self):
        if self.i >= len(self.images):
            if not self.loop:
                return
            else:
                self.i = 0
        image = self.images[self.i]
        self.f -= 1
        if self.f == 0:
            self.i += 1
            self.f = self.frames
        return image

    def next(self):
        return self.__next__()

    def iter(self):
        return self.__iter__()

    def __add__(self, ss):
        self.images.extend(ss.images)
        return self