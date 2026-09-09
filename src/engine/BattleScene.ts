import type { BattleMode, Difficulty, Faction } from '@/types/common';
import type { GameResult } from '@/types/result';
import type { TankId, Vec2 } from '@/types/geometry';
import { resetIds } from '@/types/geometry';
import { gameConfig } from '@/config';
import { Tank } from '@/entities/Tank';
import { Bullet } from '@/entities/Bullet';
import { Obstacle } from '@/entities/Obstacle';
import { Base } from '@/entities/Base';
import { Explosion } from '@/entities/Explosion';
import { EntityManager } from './EntityManager';
import { CollisionSystem } from './CollisionSystem';
import { JudgeSystem } from './JudgeSystem';
import { AIController } from '@/ai/AIController';
import { DifficultyProfileProvider } from '@/ai/DifficultyProfile';
import type { ICanvasRenderer } from '@/render/CanvasRenderer';
import type { PlayerCommand } from '@/input/types';

export interface BattleSnapshot {
  tanks: { faction: Faction; hp: number; maxHp: number; alive: boolean }[];
  bases: { faction: Faction; destroyed: boolean }[];
}

export class BattleScene {
  readonly cols: number;
  readonly rows: number;
  readonly mode: BattleMode;
  readonly difficulty: Difficulty | null;
  private entities: EntityManager;
  private collisions: CollisionSystem;
  private judge: JudgeSystem;
  private ai: AIController | null = null;
  private computerTankId: TankId | null = null;
  private player1TankId: TankId | null = null;
  private player2TankId: TankId | null = null;
  private elapsedMs = 0;
  private killCount = 0;

  constructor(mode: BattleMode, difficulty: Difficulty | null) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.cols = gameConfig.map.cols;
    this.rows = gameConfig.map.rows;
    this.entities = new EntityManager();
    this.collisions = new CollisionSystem(this.cols, this.rows);
    this.judge = new JudgeSystem(mode);
    this.buildScene();
  }

  private buildScene(): void {
    resetIds();
    const { map, tank } = gameConfig;

    for (const seed of map.obstacles) {
      this.entities.addObstacle(new Obstacle(seed.pos, seed.type));
    }
    for (const seed of map.bases) {
      this.entities.addBase(new Base(seed.faction, seed.pos));
    }

    for (const spawn of map.tanks) {
      const isComputer = spawn.faction === 'computer';
      if (isComputer && this.mode === 'pvp') continue;
      if (spawn.faction === 'player2' && this.mode === 'pve') continue;

      const pos: Vec2 = { x: spawn.pos.col + 0.5, y: spawn.pos.row + 0.5 };
      const hp = isComputer ? tank.computerHp : tank.playerHp;
      const initialDir = isComputer ? 'down' : 'up';
      const tankEntity = new Tank(
        spawn.faction,
        pos,
        initialDir,
        hp,
        tank.fireCooldownMs,
        tank.moveSpeed,
        tank.bulletSpeed
      );
      this.entities.addTank(tankEntity);

      if (spawn.faction === 'player1') this.player1TankId = tankEntity.id;
      if (spawn.faction === 'player2') this.player2TankId = tankEntity.id;
      if (isComputer) this.computerTankId = tankEntity.id;
    }

    if (this.mode === 'pve' && this.difficulty) {
      const profile = DifficultyProfileProvider.get(this.difficulty);
      this.ai = new AIController(this.difficulty, profile);
    }
  }

  getPlayer1TankId(): TankId | null {
    return this.player1TankId;
  }

  getPlayer2TankId(): TankId | null {
    return this.player2TankId;
  }

  getComputerTankId(): TankId | null {
    return this.computerTankId;
  }

  update(deltaMs: number, commands: PlayerCommand[]): void {
    this.elapsedMs += deltaMs;

    this.applyCommands(commands);
    if (this.ai) {
      this.applyAI(deltaMs);
    }

    this.updateTanks(deltaMs);
    this.updateBullets(deltaMs);

    const aliveBullets = this.entities.getAliveBullets();
    const aliveTanks = this.entities.getAliveTanks();
    const result = this.collisions.resolve(
      aliveBullets,
      aliveTanks,
      this.entities.obstacles,
      this.entities.bases
    );

    for (const explosion of result.newExplosions) {
      this.entities.addExplosion(explosion);
    }
    for (const killed of result.killedTanks) {
      this.killCount += 1;
      this.judge.recordKill();
      void killed;
    }

    for (const explosion of this.entities.explosions) {
      explosion.advance(deltaMs);
    }

    for (const tank of this.entities.tanks) {
      tank.tickCooldown(deltaMs);
    }

    this.entities.gc();
  }

  private applyCommands(commands: PlayerCommand[]): void {
    for (const cmd of commands) {
      const tank = this.entities.tanks.find((t) => t.id === cmd.tankId);
      if (!tank || !tank.alive) continue;
      switch (cmd.action.kind) {
        case 'move':
          tank.setDirection(cmd.action.direction);
          break;
        case 'fire': {
          const bullet = tank.fire();
          if (bullet) {
            this.entities.addBullet(bullet);
          }
          break;
        }
        case 'idle':
          break;
      }
    }
  }

  private applyAI(deltaMs: number): void {
    if (!this.ai || !this.computerTankId) return;
    const tank = this.entities.tanks.find((t) => t.id === this.computerTankId);
    if (!tank || !tank.alive) return;

    const enemies = this.entities.tanks.filter((t) => t.faction !== 'computer');
    const enemyBases = this.entities.bases.filter((b) => b.faction !== 'computer');
    const otherTanks = this.entities.tanks.filter((t) => t.id !== tank.id);

    const cmd = this.ai.decide(
      {
        tank,
        enemies,
        enemyBases,
        obstacles: this.entities.obstacles,
        otherTanks,
        cols: this.cols,
        rows: this.rows
      },
      this.elapsedMs
    );
    if (!cmd) return;
    void deltaMs;
    this.applyCommands([cmd]);
  }

  private updateTanks(deltaMs: number): void {
    for (const tank of this.entities.tanks) {
      if (!tank.alive) continue;
      const before = { ...tank.position };
      tank.move(deltaMs);
      if (
        !this.collisions.canTankMoveTo(
          tank,
          tank.position,
          this.entities.tanks,
          this.entities.obstacles
        )
      ) {
        tank.position = before;
        this.snapToGrid(tank);
      }
    }
  }

  private snapToGrid(tank: Tank): void {
    tank.position.x = Math.round(tank.position.x - 0.5) + 0.5;
    tank.position.y = Math.round(tank.position.y - 0.5) + 0.5;
  }

  private updateBullets(deltaMs: number): void {
    for (const bullet of this.entities.bullets) {
      if (!bullet.alive) continue;
      bullet.advance(deltaMs);
      if (bullet.isOutOfBounds(this.cols, this.rows)) {
        bullet.destroy();
      }
    }
  }

  render(renderer: ICanvasRenderer): void {
    renderer.clear();
    renderer.drawTerrain();
    for (const obstacle of this.entities.obstacles) {
      renderer.drawObstacle(obstacle);
    }
    for (const base of this.entities.bases) {
      renderer.drawBase(base);
    }
    for (const tank of this.entities.tanks) {
      renderer.drawTank(tank);
    }
    for (const bullet of this.entities.bullets) {
      renderer.drawBullet(bullet);
    }
    for (const explosion of this.entities.explosions) {
      renderer.drawExplosion(explosion);
    }
  }

  checkGameOver(): GameResult | null {
    return this.judge.check(this.entities);
  }

  snapshot(): BattleSnapshot {
    return {
      tanks: this.entities.tanks.map((t) => ({
        faction: t.faction,
        hp: t.hp,
        maxHp: t.maxHp,
        alive: t.alive
      })),
      bases: this.entities.bases.map((b) => ({
        faction: b.faction,
        destroyed: b.destroyed
      }))
    };
  }

  getKillCount(): number {
    return this.killCount;
  }

  getElapsedSec(): number {
    return this.elapsedMs / 1000;
  }

  dispose(): void {
    this.entities.clear();
    this.ai = null;
  }
}

export { Bullet, Explosion };