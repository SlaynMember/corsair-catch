export default class BeachScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private currentDirection: string = 'south';
  private isMoving: boolean = false;
  private animationFrame: number = 0;
  private animationTimer: number = 0;

  constructor() {
    super({ key: 'Beach' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background sky
    this.add.rectangle(width / 2, height / 4, width, height / 2, 0xf4a76d);

    // Beach sand
    this.add.rectangle(width / 2, (height * 3) / 4, width, height / 2, 0xf0e8d8);

    // Water
    this.add.rectangle(width / 2, height * 0.95, width, 40, 0x2dafb8);

    // Ground physics platform — invisible static body at the bottom
    const ground = this.physics.add.staticImage(width / 2, height - 20, undefined);
    ground.setScale(width * 2, 40);
    ground.setVisible(false);

    // Visual ground representation (for debugging)
    const groundViz = this.add.rectangle(width / 2, height - 20, width * 2, 40, 0xf0e8d8);
    groundViz.setDepth(-1);

    // Create player sprite
    // Start with south-facing idle frame
    this.player = this.physics.add.sprite(width / 2, height - 100, 'pirate-idle-south-0');
    this.player.setBounce(0);
    this.player.setDrag(0.1, 0);
    this.player.setMaxVelocity(200, 300);
    this.player.setCollideWorldBounds(false);

    // Create shadow under player
    // Shadow is an ellipse, positioned below the player's feet
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 30, 40, 8, 0x000000, 0.3);
    this.shadow.setDepth(-1);

    // Add collider so player doesn't fall through world
    this.physics.add.collider(this.player, ground);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Setup camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, width, height);
  }

  update() {
    if (!this.player) return;

    const speed = 150;
    let velocityX = 0;
    let velocityY = 0;
    let newDirection = this.currentDirection;

    // WASD + Arrow key input
    if (this.cursors.left?.isDown || this.keys.A.isDown) {
      velocityX = -speed;
      newDirection = 'west';
    } else if (this.cursors.right?.isDown || this.keys.D.isDown) {
      velocityX = speed;
      newDirection = 'east';
    }

    if (this.cursors.up?.isDown || this.keys.W.isDown) {
      velocityY = -speed;
      if (newDirection === 'west') newDirection = 'north-west';
      else if (newDirection === 'east') newDirection = 'north-east';
      else newDirection = 'north';
    } else if (this.cursors.down?.isDown || this.keys.S.isDown) {
      velocityY = speed;
      if (newDirection === 'west') newDirection = 'south-west';
      else if (newDirection === 'east') newDirection = 'south-east';
      else newDirection = 'south';
    }

    // Update direction and animation
    if (newDirection !== this.currentDirection) {
      this.currentDirection = newDirection;
    }

    // Apply velocity
    this.player.setVelocity(velocityX, velocityY);

    // Update animation based on movement and direction
    const moving = velocityX !== 0 || velocityY !== 0;
    this.updateAnimation(moving);

    // Update shadow position (always below player, centered)
    this.shadow.setPosition(this.player.x, this.player.y + 30);
  }

  private updateAnimation(moving: boolean) {
    const dir = this.currentDirection;
    const frameDuration = moving ? 100 : 150; // ms per frame

    this.animationTimer += 16; // ~60fps, ~16ms per frame
    if (this.animationTimer >= frameDuration) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }

    if (moving) {
      // Play run animation (has all 8 directions)
      const textureKey = `pirate-run-${dir}-${this.animationFrame}`;
      this.player.setTexture(textureKey);
    } else {
      // Play idle animation (no north direction — fallback to south)
      const idleDir = dir === 'north' ? 'south' : dir;
      const textureKey = `pirate-idle-${idleDir}-${this.animationFrame}`;
      this.player.setTexture(textureKey);
    }
  }
}
