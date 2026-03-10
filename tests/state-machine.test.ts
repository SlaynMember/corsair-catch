import { describe, it, expect, vi } from 'vitest';
import { StateMachine, GameState } from '../src/core/StateMachine';

function mockState(name: string): GameState & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    enter: vi.fn(() => calls.push(`${name}:enter`)),
    update: vi.fn(() => calls.push(`${name}:update`)),
    render: vi.fn(() => calls.push(`${name}:render`)),
    exit: vi.fn(() => calls.push(`${name}:exit`)),
  };
}

describe('StateMachine', () => {
  it('should push states and call enter', () => {
    const sm = new StateMachine();
    const state = mockState('A');
    sm.push(state);
    expect(state.enter).toHaveBeenCalled();
    expect(sm.current).toBe(state);
  });

  it('should pop states and call exit', () => {
    const sm = new StateMachine();
    const stateA = mockState('A');
    const stateB = mockState('B');
    sm.push(stateA);
    sm.push(stateB);
    expect(sm.current).toBe(stateB);

    sm.pop();
    expect(stateB.exit).toHaveBeenCalled();
    expect(sm.current).toBe(stateA);
  });

  it('should replace current state', () => {
    const sm = new StateMachine();
    const stateA = mockState('A');
    const stateB = mockState('B');
    sm.push(stateA);
    sm.replace(stateB);

    expect(stateA.exit).toHaveBeenCalled();
    expect(stateB.enter).toHaveBeenCalled();
    expect(sm.current).toBe(stateB);
    expect(sm.size).toBe(1);
  });

  it('should update and render current state', () => {
    const sm = new StateMachine();
    const state = mockState('A');
    sm.push(state);

    sm.update(0.016);
    sm.render(0.5);

    expect(state.update).toHaveBeenCalledWith(0.016);
    expect(state.render).toHaveBeenCalledWith(0.5);
  });

  it('should clear all states', () => {
    const sm = new StateMachine();
    const stateA = mockState('A');
    const stateB = mockState('B');
    sm.push(stateA);
    sm.push(stateB);

    sm.clear();
    expect(stateB.exit).toHaveBeenCalled();
    expect(stateA.exit).toHaveBeenCalled();
    expect(sm.size).toBe(0);
  });

  it('should exit current when pushing new state', () => {
    const sm = new StateMachine();
    const stateA = mockState('A');
    const stateB = mockState('B');
    sm.push(stateA);
    sm.push(stateB);

    expect(stateA.exit).toHaveBeenCalled();
  });
});
