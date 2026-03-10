import type { Component } from '../core/ECS';

export interface TransformComponent extends Component {
  type: 'transform';
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export function createTransform(
  x = 0,
  y = 0,
  z = 0,
  rotationY = 0
): TransformComponent {
  return { type: 'transform', x, y, z, rotationY };
}
