import os
import pygame
from pygame.locals import RLEACCEL


def load_image(name: str, colorkey=None) -> pygame.Surface:
    fullname = os.path.join('data', name)
    try:
        image = pygame.image.load(fullname)
    except (pygame.error, FileNotFoundError) as e:
        print("无法加载资源:", name)
        raise SystemExit(str(e))
    image = image.convert()
    if colorkey is not None:
        if colorkey == -1:
            colorkey = image.get_at((5, 5))
        image.set_colorkey(colorkey, RLEACCEL)
    return image


def load_images(names, colorkey=None):
    images = []
    for name in names:
        images.append(load_image(name, colorkey))
    return images