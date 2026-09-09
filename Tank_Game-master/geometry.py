import pygame


def clamp_to_screen(rect: pygame.Rect, cfg) -> pygame.Rect:
    if rect.left < 0:
        rect.left = 0
    elif rect.right > cfg.screen_width:
        rect.right = cfg.screen_width
    if rect.top < 0:
        rect.top = 0
    elif rect.bottom > cfg.screen_height:
        rect.bottom = cfg.screen_height
    return rect


def is_out_of_screen(rect: pygame.Rect, cfg) -> bool:
    if rect.left < 0:
        return True
    if rect.right > cfg.screen_width:
        return True
    if rect.top < 0:
        return True
    if rect.bottom > cfg.screen_height:
        return True
    return False