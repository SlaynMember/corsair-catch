import type { GameState } from '../core/StateMachine';
import type { UIManager } from '../ui/UIManager';
import { showMainMenu, hideMainMenu } from '../ui/MainMenuUI';
import { hasSave } from '../core/SaveManager';
import { audio } from '../core/AudioManager';

export class MainMenuState implements GameState {
  constructor(
    private ui: UIManager,
    private onNewGame: () => void,
    private onContinue: () => void
  ) {}

  enter(): void {
    const saveExists = hasSave();
    showMainMenu(this.ui, () => {
      audio.playSFX('menu_select');
      this.onNewGame();
    }, saveExists, () => {
      audio.playSFX('menu_select');
      this.onContinue();
    });
  }

  update(): void {}
  render(): void {}

  exit(): void {
    hideMainMenu(this.ui);
  }
}
