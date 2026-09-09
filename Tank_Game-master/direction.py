import pygame
from typing import Tuple


_BASE_VECTORS = {
    0: (0.0, -1.0),
    30: (0.5, -0.86),
    60: (0.86, -0.5),
    90: (1.0, 0.0),
    120: (0.86, 0.5),
    150: (0.5, 0.86),
    180: (0.0, 1.0),
    210: (-0.5, 0.86),
    240: (-0.86, 0.5),
    270: (-1.0, 0.0),
    300: (-0.86, -0.5),
    330: (-0.5, -0.86),
}


def normalize_rotation(rotation: int) -> int:
    if rotation % 30 != 0:
        raise ValueError("rotation 必须为 30 的倍数")
    return rotation % 360


def quantize_angle(angle: float) -> int:
    quantized = round(angle / 30) * 30
    return quantized % 360


def normalize_offset(offset: int) -> int:
    if offset % 30 != 0:
        raise ValueError("offset 必须为 30 的倍数")
    normalized = offset % 360
    if normalized > 180:
        normalized -= 360
    return normalized


def move_vector(rotation: int, speed: float) -> Tuple[float, float]:
    normalized = normalize_rotation(rotation)
    base_x, base_y = _BASE_VECTORS[normalized]
    return (base_x * speed, base_y * speed)


def select_image(rotation: int, base_images) -> pygame.Surface:
    normalized = normalize_rotation(rotation)
    flip = pygame.transform.flip
    if normalized == 0:
        return base_images[0]
    elif normalized == 30:
        return base_images[1]
    elif normalized == 60:
        return base_images[2]
    elif normalized == 90:
        return base_images[3]
    elif normalized == 120:
        return flip(base_images[2], 0, 1)
    elif normalized == 150:
        return flip(base_images[1], 0, 1)
    elif normalized == 180:
        return flip(base_images[0], 0, 1)
    elif normalized == 210:
        return flip(base_images[1], 1, 1)
    elif normalized == 240:
        return flip(base_images[2], 1, 1)
    elif normalized == 270:
        return flip(base_images[3], 1, 0)
    elif normalized == 300:
        return flip(base_images[2], 1, 0)
    elif normalized == 330:
        return flip(base_images[1], 1, 0)
    raise ValueError("rotation 不在合法集合内")