import { Assets } from 'pixi.js';
import { GameLoop } from './GameLoop';
import { StateMachine } from './StateMachine';
import { InputManager } from './InputManager';
import { createPixiContext, PixiContext } from '../rendering/PixiContext';
import { UIManager } from '../ui/UIManager';
import { MainMenuState } from '../states/MainMenuState';
import { SailingState } from '../states/SailingState';
import { IslandState } from '../states/IslandState';
import { loadGame } from './SaveManager';

const SPRITE_ASSETS = [
  'sprites/ship-sun.png',
  'sprites/ship-skull.png',
  'sprites/ship-blue.png',
  'sprites/ship-anchor.png',
  'sprites/char-starter.png',
  'sprites/char-starter-fishing.png',
  'sprites/char-captain.png',
  'sprites/char-cook.png',
  'sprites/char-navigator.png',
  'sprites/island-bg.png',
  'sprites/fish-fire.png',
  'sprites/fish-water.png',
  'sprites/fish-electric.png',
  'sprites/fish-grass.png',
];

export class Game {
  private loop!: GameLoop;
  private stateMachine!: StateMachine;
  private input!: InputManager;
  private pixiCtx!: PixiContext;
  private ui!: UIManager;

  private constructor() {}

  static async create(canvas: HTMLCanvasElement): Promise<Game> {
    const game = new Game();
    game.pixiCtx = await createPixiContext(canvas);

    // Preload all PNG sprite assets before any state starts
    await Assets.load(SPRITE_ASSETS);
    // Set nearest-neighbor scaling for pixel-perfect rendering
    for (const path of SPRITE_ASSETS) {
      const tex = Assets.get(path);
      if (tex) tex.source.scaleMode = 'nearest';
    }

    game.input = new InputManager();
    game.ui = new UIManager();
    game.stateMachine = new StateMachine();
    game.loop = new GameLoop(
      (dt) => game.update(dt),
      (interpolation) => game.render(interpolation)
    );
    return game;
  }

  start(): void {
    this.stateMachine.push(
      new MainMenuState(this.ui, () => this.startNewGame(), () => this.continueGame())
    );
    this.loop.start();
  }

  private startNewGame(): void {
    this.stateMachine.replace(
      new IslandState(this.pixiCtx, this.input, this.ui, this.stateMachine, 'sunlit_cove')
    );
  }

  private continueGame(): void {
    const save = loadGame();
    // Continue loads to island (Sunlit Cove as default)
    this.stateMachine.replace(
      new IslandState(this.pixiCtx, this.input, this.ui, this.stateMachine, 'sunlit_cove', save ?? undefined)
    );
  }

  private update(dt: number): void {
    this.stateMachine.update(dt);
    this.input.endFrame();
  }

  private render(interpolation: number): void {
    this.stateMachine.render(interpolation);
  }
}
