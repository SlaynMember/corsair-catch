import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import BootScene from './scenes/BootScene';
import MainMenuScene from './scenes/MainMenuScene';
import BeachScene from './scenes/BeachScene';
import BattleScene from './scenes/BattleScene';
import SailingScene from './scenes/SailingScene';
import Beach2Scene from './scenes/Beach2Scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-shell',
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [PreloadScene, BootScene, MainMenuScene, BeachScene, BattleScene, SailingScene, Beach2Scene],
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    powerPreference: 'high-performance',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// Attempt to lock orientation to landscape on mobile
try {
  (screen.orientation as any).lock('landscape').catch(() => {});
} catch (_) {}

// Expose for Playwright / devtools
(window as any).game = game;
