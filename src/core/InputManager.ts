export class InputManager {
  private keysDown = new Set<string>();
  private keysPressed = new Set<string>();
  private keysReleased = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.keysDown.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keysDown.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysReleased.add(e.code);
    });

    if (this.isTouchDevice()) {
      this.createTouchUI();
    }
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private createTouchUI(): void {
    const container = document.createElement('div');
    container.id = 'touch-controls';
    container.innerHTML = `
      <div class="touch-joystick" id="touch-joystick">
        <div class="touch-joystick-knob" id="touch-knob"></div>
      </div>
      <div class="touch-buttons">
        <button class="touch-btn touch-btn-action" id="touch-space">ACT</button>
        <button class="touch-btn touch-btn-inv" id="touch-inv">INV</button>
        <button class="touch-btn touch-btn-esc" id="touch-esc">ESC</button>
      </div>
    `;
    document.body.appendChild(container);

    const joystick = document.getElementById('touch-joystick')!;
    const knob = document.getElementById('touch-knob')!;
    const joystickRadius = 40;
    let joystickActive = false;
    let joystickCenterX = 0;
    let joystickCenterY = 0;

    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = joystick.getBoundingClientRect();
      joystickCenterX = rect.left + rect.width / 2;
      joystickCenterY = rect.top + rect.height / 2;
      joystickActive = true;
      const t = e.touches[0];
      this.updateJoystick(t.clientX, t.clientY, joystickCenterX, joystickCenterY, joystickRadius, knob);
    }, { passive: false });

    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!joystickActive) return;
      const t = e.touches[0];
      this.updateJoystick(t.clientX, t.clientY, joystickCenterX, joystickCenterY, joystickRadius, knob);
    }, { passive: false });

    joystick.addEventListener('touchend', (e) => {
      e.preventDefault();
      joystickActive = false;
      knob.style.transform = 'translate(-50%, -50%)';
      this.keysDown.delete('KeyW');
      this.keysDown.delete('KeyS');
      this.keysDown.delete('KeyA');
      this.keysDown.delete('KeyD');
    }, { passive: false });

    const bindBtn = (id: string, code: string) => {
      const btn = document.getElementById(id)!;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!this.keysDown.has(code)) this.keysPressed.add(code);
        this.keysDown.add(code);
      }, { passive: false });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keysDown.delete(code);
        this.keysReleased.add(code);
      }, { passive: false });
    };

    bindBtn('touch-space', 'Space');
    bindBtn('touch-inv', 'KeyI');
    bindBtn('touch-esc', 'Escape');
  }

  private updateJoystick(
    touchX: number, touchY: number,
    centerX: number, centerY: number,
    radius: number, knob: HTMLElement
  ): void {
    let dx = touchX - centerX;
    let dy = touchY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    const mag = Math.min(dist / radius, 1);
    const threshold = 0.3;

    const setKey = (code: string, active: boolean) => {
      if (active && !this.keysDown.has(code)) this.keysDown.add(code);
      else if (!active) this.keysDown.delete(code);
    };

    setKey('KeyW', mag > threshold && dy < -radius * 0.2);
    setKey('KeyS', mag > threshold && dy > radius * 0.4);
    setKey('KeyA', mag > threshold && dx < -radius * 0.3);
    setKey('KeyD', mag > threshold && dx > radius * 0.3);
  }

  isDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  wasPressed(code: string): boolean {
    return this.keysPressed.has(code);
  }

  wasReleased(code: string): boolean {
    return this.keysReleased.has(code);
  }

  endFrame(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
}
