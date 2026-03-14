/**
 * MobileInput — Virtual joystick + action button system for mobile/touch devices.
 *
 * Floating joystick appears in the left 40% of the screen on touch.
 * Action button (SPACE equivalent) sits at bottom-right, always visible.
 * Optional BOOST button for sailing context.
 *
 * All UI is depth 1000, scroll-factor 0 (fixed to screen, not world).
 * Desktop users pay zero cost — constructor early-returns when IS_MOBILE is false.
 */

type InputContext = 'overworld' | 'battle' | 'fishing' | 'dialogue' | 'sailing';

const JOYSTICK_BASE_RADIUS = 60;
const JOYSTICK_THUMB_RADIUS = 20;
const JOYSTICK_MAX_DRAG = 50;
const JOYSTICK_ZONE_RATIO = 0.4; // left 40% of screen

const ACTION_BTN_RADIUS = 40;
const ACTION_BTN_MARGIN = 30; // from screen edges
const ACTION_BTN_HIT_RADIUS = 56; // larger touch target than visual radius

const BOOST_BTN_RADIUS = 34;
const BOOST_BTN_MARGIN_ABOVE_ACTION = 24;

const UI_DEPTH = 1000;

const COLOR_GOLD = 0xffe066;
const COLOR_WOOD = 0x8b6b4d;

const FONT_BODY = 'PokemonDP';

const CONTEXT_LABELS: Record<InputContext, string> = {
  overworld: 'ACT',
  battle: 'OK',
  fishing: 'REEL',
  dialogue: 'OK',
  sailing: 'ACT',
};

/** Read CSS safe-area-inset-* values and convert to Phaser game coordinates. */
function getSafeAreaInsets(scene: Phaser.Scene): { top: number; right: number; bottom: number; left: number } {
  const defaults = { top: 0, right: 0, bottom: 0, left: 0 };
  try {
    const style = getComputedStyle(document.documentElement);
    const parse = (prop: string): number => parseFloat(style.getPropertyValue(prop)) || 0;
    const cssTop = parse('--sai-top');
    const cssRight = parse('--sai-right');
    const cssBottom = parse('--sai-bottom');
    const cssLeft = parse('--sai-left');
    // Convert CSS pixels → game coordinates using Phaser's scale factor
    const canvas = scene.game.canvas;
    const scaleX = scene.scale.width / (canvas.clientWidth || scene.scale.width);
    const scaleY = scene.scale.height / (canvas.clientHeight || scene.scale.height);
    return {
      top: cssTop * scaleY,
      right: cssRight * scaleX,
      bottom: cssBottom * scaleY,
      left: cssLeft * scaleX,
    };
  } catch {
    return defaults;
  }
}

export default class MobileInput {
  static readonly IS_MOBILE: boolean =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  private scene: Phaser.Scene;

  // --- Joystick ---
  private joystickContainer: Phaser.GameObjects.Container | null = null;
  private joystickBase: Phaser.GameObjects.Arc | null = null;
  private joystickThumb: Phaser.GameObjects.Arc | null = null;
  private joystickOrigin: { x: number; y: number } = { x: 0, y: 0 };
  private joystickPointerId: number = -1;
  private movementVector: { x: number; y: number } = { x: 0, y: 0 };

  // --- Action button ---
  private actionContainer: Phaser.GameObjects.Container | null = null;
  private actionLabel: Phaser.GameObjects.Text | null = null;
  private actionPointerId: number = -1;
  private actionDown: boolean = false;
  private actionConsumed: boolean = false;

  // --- Boost button (sailing only) ---
  private boostContainer: Phaser.GameObjects.Container | null = null;
  private boostLabel: Phaser.GameObjects.Text | null = null;
  private boostPointerId: number = -1;
  private boostHeld: boolean = false;

  private currentContext: InputContext = 'overworld';
  private _enabled: boolean = true;
  private boundPointerDown: (p: Phaser.Input.Pointer) => void;
  private boundPointerMove: (p: Phaser.Input.Pointer) => void;
  private boundPointerUp: (p: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    if (!MobileInput.IS_MOBILE) {
      // Bind no-ops so destroy() is safe
      this.boundPointerDown = () => {};
      this.boundPointerMove = () => {};
      this.boundPointerUp = () => {};
      return;
    }

    // Enable multi-touch (up to 4 pointers)
    scene.input.addPointer(3);

    this.createJoystick();
    this.createActionButton();
    this.createBoostButton();

    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);

    scene.input.on('pointerdown', this.boundPointerDown);
    scene.input.on('pointermove', this.boundPointerMove);
    scene.input.on('pointerup', this.boundPointerUp);
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /** Normalized movement vector from joystick. { x: -1..1, y: -1..1 }. Zero when idle. */
  getMovementVector(): { x: number; y: number } {
    return this.movementVector;
  }

  /** True for one call after the action button is pressed (latch). */
  isActionJustDown(): boolean {
    if (this.actionDown && !this.actionConsumed) {
      this.actionConsumed = true;
      return true;
    }
    return false;
  }

  /** True while the boost button is held (sailing only). */
  isBoostHeld(): boolean {
    return this.boostHeld;
  }

  /** Temporarily disable all MobileInput processing (hides joystick + action). */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (!MobileInput.IS_MOBILE) return;
    if (!enabled) {
      // Release any active pointers
      this.joystickPointerId = -1;
      this.movementVector = { x: 0, y: 0 };
      this.actionPointerId = -1;
      this.actionDown = false;
      this.joystickContainer?.setVisible(false);
      this.actionContainer?.setVisible(false);
      this.boostContainer?.setVisible(false);
    } else {
      this.actionContainer?.setVisible(true);
      this.boostContainer?.setVisible(this.currentContext === 'sailing');
    }
  }

  /** Switch context to update button labels and visibility. */
  showContextButtons(context: InputContext): void {
    this.currentContext = context;
    if (!MobileInput.IS_MOBILE) return;

    // Update action label and ensure visible
    if (this.actionLabel) {
      this.actionLabel.setText(CONTEXT_LABELS[context]);
    }
    this.actionContainer?.setVisible(true);

    // Show boost button only in sailing context
    if (this.boostContainer) {
      this.boostContainer.setVisible(context === 'sailing');
    }
  }

  /** Tear down all UI and event listeners. */
  destroy(): void {
    if (!MobileInput.IS_MOBILE) return;

    this.scene.input.off('pointerdown', this.boundPointerDown);
    this.scene.input.off('pointermove', this.boundPointerMove);
    this.scene.input.off('pointerup', this.boundPointerUp);

    this.joystickContainer?.destroy();
    this.actionContainer?.destroy();
    this.boostContainer?.destroy();

    this.joystickContainer = null;
    this.actionContainer = null;
    this.boostContainer = null;
  }

  // =========================================================================
  // CREATION
  // =========================================================================

  private createJoystick(): void {
    const base = this.scene.add.circle(0, 0, JOYSTICK_BASE_RADIUS, 0x000000, 0.3);
    const thumb = this.scene.add.circle(0, 0, JOYSTICK_THUMB_RADIUS, COLOR_GOLD, 0.85);

    const container = this.scene.add.container(0, 0, [base, thumb]);
    container.setDepth(UI_DEPTH);
    container.setScrollFactor(0);
    container.setVisible(false);

    this.joystickBase = base;
    this.joystickThumb = thumb;
    this.joystickContainer = container;
  }

  private createActionButton(): void {
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    const sai = getSafeAreaInsets(this.scene);
    const cx = sw - ACTION_BTN_RADIUS - ACTION_BTN_MARGIN - sai.right;
    const cy = sh - ACTION_BTN_RADIUS - ACTION_BTN_MARGIN - sai.bottom;

    // Outer ring (wood brown)
    const ring = this.scene.add.circle(0, 0, ACTION_BTN_RADIUS, COLOR_WOOD, 0.9);
    // Inner fill (gold)
    const fill = this.scene.add.circle(0, 0, ACTION_BTN_RADIUS - 5, COLOR_GOLD, 0.95);

    const label = this.scene.add.text(0, 0, CONTEXT_LABELS[this.currentContext], {
      fontFamily: FONT_BODY,
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const container = this.scene.add.container(cx, cy, [ring, fill, label]);
    container.setDepth(UI_DEPTH);
    container.setScrollFactor(0);

    this.actionContainer = container;
    this.actionLabel = label;
  }

  private createBoostButton(): void {
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    const sai = getSafeAreaInsets(this.scene);
    // Position above the action button
    const cx = sw - ACTION_BTN_RADIUS - ACTION_BTN_MARGIN - sai.right;
    const cy =
      sh -
      ACTION_BTN_RADIUS -
      ACTION_BTN_MARGIN -
      sai.bottom -
      ACTION_BTN_RADIUS * 2 -
      BOOST_BTN_MARGIN_ABOVE_ACTION;

    const ring = this.scene.add.circle(0, 0, BOOST_BTN_RADIUS, COLOR_WOOD, 0.85);
    const fill = this.scene.add.circle(0, 0, BOOST_BTN_RADIUS - 4, 0x44aaff, 0.9);

    const label = this.scene.add.text(0, 0, 'BOOST', {
      fontFamily: FONT_BODY,
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const container = this.scene.add.container(cx, cy, [ring, fill, label]);
    container.setDepth(UI_DEPTH);
    container.setScrollFactor(0);
    container.setVisible(false); // only shown in sailing context

    this.boostContainer = container;
    this.boostLabel = label;
  }

  // =========================================================================
  // POINTER HANDLERS
  // =========================================================================

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this._enabled) return;
    const zoneEdge = this.scene.scale.width * JOYSTICK_ZONE_RATIO;

    // --- Joystick zone (left 40%) ---
    if (pointer.x < zoneEdge && this.joystickPointerId === -1) {
      this.joystickPointerId = pointer.id;
      this.joystickOrigin.x = pointer.x;
      this.joystickOrigin.y = pointer.y;

      if (this.joystickContainer) {
        this.joystickContainer.setPosition(pointer.x, pointer.y);
        this.joystickContainer.setVisible(true);
      }
      if (this.joystickThumb) {
        this.joystickThumb.setPosition(0, 0);
      }
      this.movementVector.x = 0;
      this.movementVector.y = 0;
      return;
    }

    // --- Action button hit test (use larger touch radius for easier tapping) ---
    if (this.actionPointerId === -1 && this.hitTestButton(pointer, this.actionContainer, ACTION_BTN_HIT_RADIUS)) {
      this.actionPointerId = pointer.id;
      this.actionDown = true;
      this.actionConsumed = false;
      this.pulseButton(this.actionContainer, 0.9);
      return;
    }

    // --- Boost button hit test (sailing only) ---
    if (
      this.currentContext === 'sailing' &&
      this.boostPointerId === -1 &&
      this.hitTestButton(pointer, this.boostContainer, BOOST_BTN_RADIUS)
    ) {
      this.boostPointerId = pointer.id;
      this.boostHeld = true;
      this.pulseButton(this.boostContainer, 0.9);
      return;
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this._enabled) return;
    // --- Joystick tracking ---
    if (pointer.id === this.joystickPointerId) {
      const dx = pointer.x - this.joystickOrigin.x;
      const dy = pointer.y - this.joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let clampedX = dx;
      let clampedY = dy;

      if (dist > JOYSTICK_MAX_DRAG) {
        const ratio = JOYSTICK_MAX_DRAG / dist;
        clampedX = dx * ratio;
        clampedY = dy * ratio;
      }

      if (this.joystickThumb) {
        this.joystickThumb.setPosition(clampedX, clampedY);
      }

      // Dead zone: ignore tiny drifts (< 15% of max drag)
      const deadZone = JOYSTICK_MAX_DRAG * 0.15;
      if (dist < deadZone) {
        this.movementVector.x = 0;
        this.movementVector.y = 0;
      } else {
        // Normalize to -1..1
        this.movementVector.x = clampedX / JOYSTICK_MAX_DRAG;
        this.movementVector.y = clampedY / JOYSTICK_MAX_DRAG;
      }
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    // --- Joystick release ---
    if (pointer.id === this.joystickPointerId) {
      this.joystickPointerId = -1;
      this.movementVector.x = 0;
      this.movementVector.y = 0;

      if (this.joystickContainer) {
        this.joystickContainer.setVisible(false);
      }
      if (this.joystickThumb) {
        this.joystickThumb.setPosition(0, 0);
      }
    }

    // --- Action button release ---
    if (pointer.id === this.actionPointerId) {
      this.actionPointerId = -1;
      this.actionDown = false;
      this.resetButtonScale(this.actionContainer);
    }

    // --- Boost button release ---
    if (pointer.id === this.boostPointerId) {
      this.boostPointerId = -1;
      this.boostHeld = false;
      this.resetButtonScale(this.boostContainer);
    }
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /** Circular hit test against a container's world position. */
  private hitTestButton(
    pointer: Phaser.Input.Pointer,
    container: Phaser.GameObjects.Container | null,
    radius: number,
  ): boolean {
    if (!container || !container.visible) return false;
    const dx = pointer.x - container.x;
    const dy = pointer.y - container.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  /** Quick scale-down pulse for tactile feedback. */
  private pulseButton(container: Phaser.GameObjects.Container | null, scale: number): void {
    if (!container) return;
    this.scene.tweens.add({
      targets: container,
      scaleX: scale,
      scaleY: scale,
      duration: 60,
      ease: 'Quad.easeOut',
    });
  }

  /** Restore button scale after release. */
  private resetButtonScale(container: Phaser.GameObjects.Container | null): void {
    if (!container) return;
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 80,
      ease: 'Quad.easeOut',
    });
  }
}
