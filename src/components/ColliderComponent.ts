import type { Component } from '../core/ECS';

export interface ColliderComponent extends Component {
  type: 'collider';
  radius: number;
  layer: 'player' | 'enemy' | 'zone' | 'island';
  isTrigger: boolean;
}

export function createCollider(
  radius: number,
  layer: ColliderComponent['layer'],
  isTrigger = false
): ColliderComponent {
  return { type: 'collider', radius, layer, isTrigger };
}
