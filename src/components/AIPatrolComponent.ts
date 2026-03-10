import type { Component } from '../core/ECS';

export interface AIPatrolComponent extends Component {
  type: 'ai_patrol';
  waypoints: { x: number; z: number }[];
  currentWaypointIndex: number;
  aggroRadius: number;
  state: 'patrol' | 'chase' | 'returning' | 'defeated';
  waypointThreshold: number;
  chaseCooldown: number;
  idlePauseTimer: number;
  idlePauseDuration: number;
}

export function createAIPatrol(
  waypoints: { x: number; z: number }[],
  aggroRadius = 20
): AIPatrolComponent {
  return {
    type: 'ai_patrol',
    waypoints,
    currentWaypointIndex: 0,
    aggroRadius,
    state: 'patrol',
    waypointThreshold: 2,
    chaseCooldown: 0,
    idlePauseTimer: 0,
    idlePauseDuration: 0,
  };
}
