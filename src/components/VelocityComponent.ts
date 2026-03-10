import type { Component } from '../core/ECS';

export interface VelocityComponent extends Component {
  type: 'velocity';
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  turnRate: number;
}

export function createVelocity(
  speed = 8,
  turnRate = 2.5
): VelocityComponent {
  return { type: 'velocity', vx: 0, vy: 0, vz: 0, speed, turnRate };
}
