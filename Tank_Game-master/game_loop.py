import random
import pygame
from pygame.locals import K_ESCAPE, QUIT
from pygame.sprite import spritecollide
from config import GameConfig
from entities.tank import Tank
from entities.tank_ai import TankAI
from renderer import Renderer, MatchState


def _reset_match(cfg):
    player = Tank([50, 50], cfg)
    player_sprites = pygame.sprite.Group()
    player_sprites.add(player)

    ai_sprites = pygame.sprite.Group()
    for _ in range(cfg.ai_initial_count):
        pos = [random.randint(200, cfg.screen_width - 24),
               random.randint(200, cfg.screen_height - 24)]
        ai_sprites.add(TankAI(pos, cfg))

    explosions = pygame.sprite.Group()
    return player, player_sprites, ai_sprites, explosions


def run():
    cfg = GameConfig()
    pygame.init()
    screen = pygame.display.set_mode([cfg.screen_width, cfg.screen_height])
    pygame.display.set_caption('Tank Game')

    player, player_sprites, ai_sprites, explosions = _reset_match(cfg)

    clock = pygame.time.Clock()
    background = pygame.Surface(screen.get_size()).convert()
    background.fill(cfg.background_color)
    renderer = Renderer(screen, cfg)

    match_state = MatchState.PLAYING
    running = True
    while running:
        clock.tick(cfg.fps)

        for event in pygame.event.get():
            if event.type == QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == K_ESCAPE:
                running = False

        if match_state == MatchState.PLAYING:
            pressed = pygame.key.get_pressed()

            player.update(pressed)

            for ai in ai_sprites:
                ai.update(player.turret.shells, player.rect.center)
                explosion = ai.pending_explosion
                if explosion is not None:
                    explosions.add(explosion)

            player.turret.shells.update()
            for ai in ai_sprites:
                ai.turret.shells.update()

            explosions.update()

            ai_shells = pygame.sprite.Group()
            for ai in ai_sprites:
                ai_shells.add(ai.turret.shells)

            if spritecollide(player, ai_shells, True):
                match_state = MatchState.FAIL
            elif len(ai_sprites) == 0:
                match_state = MatchState.WIN

            all_shells = pygame.sprite.Group()
            all_shells.add(player.turret.shells)
            all_shells.add(ai_shells)

            turrets = pygame.sprite.Group()
            turrets.add(player.turret)
            for ai in ai_sprites:
                turrets.add(ai.turret)

            flashes = []
            if player.turret.flash is not None:
                flashes.append((player.turret.flash,
                                player.turret.flash.get_rect(center=player.turret.rect.center)))
            for ai in ai_sprites:
                if ai.turret.flash is not None:
                    flashes.append((ai.turret.flash,
                                    ai.turret.flash.get_rect(center=ai.turret.rect.center)))

            tanks = pygame.sprite.Group()
            tanks.add(player_sprites)
            for ai in ai_sprites:
                tanks.add(ai)

            renderer.render(background, all_shells, tanks,
                            turrets, flashes, explosions, clock.get_rawtime())

            player.turret.clear_flash()
            for ai in ai_sprites:
                ai.turret.clear_flash()
        else:
            renderer.render_end_screen(match_state)
            for event in pygame.event.get():
                if event.type == QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == cfg.end_screen_restart_key:
                        player, player_sprites, ai_sprites, explosions = _reset_match(cfg)
                        match_state = MatchState.PLAYING
                    elif event.key == cfg.end_screen_quit_key:
                        running = False

    pygame.quit()
