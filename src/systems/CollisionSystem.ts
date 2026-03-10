import type { Entity, System } from '../core/ECS';
import type { TransformComponent } from '../components/TransformComponent';
import type { ColliderComponent } from '../components/ColliderComponent';
import { EventBus } from '../core/EventBus';
import { distanceSq } from '../utils/math';

export interface CollisionEvent {
  entityA: Entity;
  entityB: Entity;
  layerA: string;
  layerB: string;
}

export class CollisionSystem implements System {
  readonly requiredComponents = ['transform', 'collider'];
  private cooldowns = new Map<string, number>();
  private cooldownTime = 1.0; // seconds between re-triggering same pair

  constructor(private eventBus: EventBus) {}

  update(entities: Entity[], dt: number): void {
    // Decrement cooldowns
    for (const [key, time] of this.cooldowns) {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.cooldowns.delete(key);
      } else {
        this.cooldowns.set(key, newTime);
      }
    }

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i];
        const b = entities[j];

        const ta = a.getComponent<TransformComponent>('transform');
        const tb = b.getComponent<TransformComponent>('transform');
        const ca = a.getComponent<ColliderComponent>('collider');
        const cb = b.getComponent<ColliderComponent>('collider');

        const dist2 = distanceSq(ta.x, ta.z, tb.x, tb.z);
        const combinedRadius = ca.radius + cb.radius;

        if (dist2 < combinedRadius * combinedRadius) {
          const pairKey = `${Math.min(a.id, b.id)}_${Math.max(a.id, b.id)}`;
          if (this.cooldowns.has(pairKey)) continue;

          this.cooldowns.set(pairKey, this.cooldownTime);
          this.eventBus.emit<CollisionEvent>('collision', {
            entityA: a,
            entityB: b,
            layerA: ca.layer,
            layerB: cb.layer,
          });
        }
      }
    }
  }
}
