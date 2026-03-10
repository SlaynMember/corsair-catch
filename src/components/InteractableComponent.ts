import type { Component } from '../core/ECS';

export type InteractionType = 'fishing_zone' | 'dock' | 'battle';

export interface InteractableComponent extends Component {
  type: 'interactable';
  interactionType: InteractionType;
  zoneId?: string;
  prompt?: string;
}

export function createInteractable(
  interactionType: InteractionType,
  zoneId?: string,
  prompt?: string
): InteractableComponent {
  return { type: 'interactable', interactionType, zoneId, prompt };
}
