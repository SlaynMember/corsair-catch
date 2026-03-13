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

// Dev warp — type warp('Beach2') in console to skip to any scene
(window as any).warp = (sceneKey: string) => {
  // Give the player a starter fish so scenes don't break
  const party = game.registry.get('party');
  if (!party || party.length === 0) {
    game.registry.set('party', [{
      speciesId: 4, nickname: 'Emberkoi', level: 10,
      currentHp: 55, maxHp: 55, moves: ['ember', 'tackle'],
    }]);
    game.registry.set('inventory', { wood: 5, rope: 3, bait: 2 });
  }
  game.scene.getScenes(true).forEach(s => game.scene.stop(s.scene.key));
  game.scene.start(sceneKey);
  console.log(`Warped to ${sceneKey}`);
};
