import type { Component } from '../core/ECS';
import type { Container } from 'pixi.js';

export interface MeshComponent extends Component {
  type: 'mesh';
  object: Container;
  addedToScene: boolean;
}

export function createMesh(object: Container): MeshComponent {
  return { type: 'mesh', object, addedToScene: false };
}
