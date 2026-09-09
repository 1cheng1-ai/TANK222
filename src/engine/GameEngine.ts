import type { BattleMode, Difficulty, GamePhase } from '@/types/common';
import type { GameResult } from '@/types/result';
import { GameStateMachine } from './GameStateMachine';
import { BattleScene } from './BattleScene';
import type { BattleSnapshot } from './BattleScene';
import { GameLoop } from './GameLoop';
import { KeyboardInput } from '@/input/KeyboardInput';
import { CommandBuffer } from '@/input/CommandBuffer';
import { CanvasRenderer } from '@/render/CanvasRenderer';
import { Camera } from '@/render/Camera';
import type { ICanvasRenderer } from '@/render/CanvasRenderer';

export interface IUiState {
  phase: GamePhase;
  selectedMode: BattleMode;
  selectedDifficulty: Difficulty;
  result: GameResult | null;
  error: string | null;
}

export type UiStateListener = (state: IUiState) => void;

export class GameEngine {
  private fsm: GameStateMachine;
  private loop: GameLoop | null = null;
  private scene: BattleScene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: ICanvasRenderer | null = null;
  private camera: Camera | null = null;
  private input: KeyboardInput;
  private buffer: CommandBuffer;
  private selectedMode: BattleMode = 'pve';
  private selectedDifficulty: Difficulty = 'normal';
  private result: GameResult | null = null;
  private error: string | null = null;
  private listeners: UiStateListener[] = [];
  private resizeHandler: (() => void) | null = null;

  constructor() {
    this.fsm = new GameStateMachine('mainMenu');
    this.buffer = new CommandBuffer();
    this.input = new KeyboardInput(this.buffer);
    this.fsm.subscribe((phase) => this.emitState(phase));
  }

  start(): void {
    this.input.attach();
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupRenderer();
    this.resizeHandler = () => this.setupRenderer();
    window.addEventListener('resize', this.resizeHandler);
  }

  detachCanvas(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    this.canvas = null;
    this.renderer = null;
    this.camera = null;
  }

  private setupRenderer(): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = rect.width > 0 ? rect.width : 600;
    const cssHeight = rect.height > 0 ? rect.height : 600;
    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    if (!this.camera) {
      this.camera = new Camera(26, 26, cssWidth, cssHeight);
    } else {
      this.camera.resize(cssWidth, cssHeight);
    }
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    try {
      this.renderer = new CanvasRenderer(this.canvas, this.camera);
    } catch (e) {
      this.error = `渲染器初始化失败: ${(e as Error).message}`;
      this.emitState(this.fsm.get());
    }
  }

  transitionTo(state: GamePhase): void {
    this.fsm.transitionTo(state);
  }

  setMode(mode: BattleMode): void {
    this.selectedMode = mode;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.selectedDifficulty = difficulty;
  }

  beginBattle(): void {
    try {
      this.result = null;
      this.error = null;
      const difficulty = this.selectedMode === 'pve' ? this.selectedDifficulty : null;
      this.scene = new BattleScene(this.selectedMode, difficulty);
      this.setupInputBindings();
      this.fsm.transitionTo('battle');
      this.startLoop();
    } catch (e) {
      this.error = `开始对战失败: ${(e as Error).message}`;
      this.emitState(this.fsm.get());
    }
  }

  restartBattle(): void {
    this.stopLoop();
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
    this.beginBattle();
  }

  backToMenu(): void {
    this.stopLoop();
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
    this.input.clearBindings();
    this.result = null;
    this.fsm.transitionTo('mainMenu');
  }

  goToModeSelect(): void {
    this.fsm.transitionTo('modeSelect');
  }

  goToDifficultySelect(): void {
    if (this.selectedMode === 'pvp') return;
    this.fsm.transitionTo('difficultySelect');
  }

  goToHelp(): void {
    this.fsm.transitionTo('help');
  }

  subscribeUiState(listener: UiStateListener): () => void {
    this.listeners.push(listener);
    listener(this.buildState(this.fsm.get()));
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  getSnapshot(): BattleSnapshot | null {
    return this.scene ? this.scene.snapshot() : null;
  }

  private setupInputBindings(): void {
    this.input.clearBindings();
    if (!this.scene) return;
    const p1 = this.scene.getPlayer1TankId();
    if (p1) this.input.bindPlayer1(p1);
    if (this.scene.mode === 'pvp') {
      const p2 = this.scene.getPlayer2TankId();
      if (p2) this.input.bindPlayer2(p2);
    }
  }

  private startLoop(): void {
    this.stopLoop();
    this.loop = new GameLoop((deltaMs) => this.tick(deltaMs));
    this.loop.start();
  }

  private stopLoop(): void {
    if (this.loop) {
      this.loop.stop();
      this.loop = null;
    }
  }

  private tick(deltaMs: number): void {
    if (!this.scene || !this.renderer) return;
    try {
      const commands = this.input.poll();
      this.scene.update(deltaMs, commands);
      this.scene.render(this.renderer);

      const result = this.scene.checkGameOver();
      if (result) {
        this.result = result;
        this.stopLoop();
        this.input.clearBindings();
        this.fsm.transitionTo('result');
      }
    } catch (e) {
      this.error = `游戏运行错误: ${(e as Error).message}`;
      this.stopLoop();
      this.emitState(this.fsm.get());
    }
  }

  private buildState(phase: GamePhase): IUiState {
    return {
      phase,
      selectedMode: this.selectedMode,
      selectedDifficulty: this.selectedDifficulty,
      result: this.result,
      error: this.error
    };
  }

  private emitState(phase: GamePhase): void {
    const state = this.buildState(phase);
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  dispose(): void {
    this.stopLoop();
    this.input.detach();
    this.detachCanvas();
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
  }
}