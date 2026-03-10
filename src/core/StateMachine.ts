export interface GameState {
  enter(params?: any): void;
  update(dt: number): void;
  render(interpolation: number): void;
  exit(): void;
  resume?(): void;
}

export class StateMachine {
  private stack: GameState[] = [];

  get current(): GameState | undefined {
    return this.stack[this.stack.length - 1];
  }

  get size(): number {
    return this.stack.length;
  }

  push(state: GameState, params?: any): void {
    this.current?.exit();
    this.stack.push(state);
    state.enter(params);
  }

  pop(): GameState | undefined {
    const state = this.stack.pop();
    state?.exit();
    // Call resume() if available, otherwise enter() for backward compat
    if (this.current?.resume) {
      this.current.resume();
    }
    return state;
  }

  replace(state: GameState, params?: any): void {
    const old = this.stack.pop();
    old?.exit();
    this.stack.push(state);
    state.enter(params);
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(interpolation: number): void {
    this.current?.render(interpolation);
  }

  clear(): void {
    while (this.stack.length > 0) {
      this.stack.pop()?.exit();
    }
  }
}
