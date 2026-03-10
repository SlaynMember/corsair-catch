import type { Entity, System } from '../core/ECS';
import type { TransformComponent } from '../components/TransformComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { MeshComponent } from '../components/MeshComponent';
import { WORLD_BOUNDARY } from '../data/constants';
import { clamp } from '../utils/math';

export class MovementSystem implements System {
  readonly requiredComponents = ['transform', 'velocity'];

  update(entities: Entity[], dt: number): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');

      transform.x += velocity.vx * dt;
      transform.y += velocity.vy * dt;
      transform.z += velocity.vz * dt;

      // Clamp to world bounds
      transform.x = clamp(transform.x, -WORLD_BOUNDARY, WORLD_BOUNDARY);
      transform.z = clamp(transform.z, -WORLD_BOUNDARY, WORLD_BOUNDARY);

      // Sync 2D container: x = world x, y = world z (top-down projection)
      if (entity.hasComponent('mesh')) {
        const meshComp = entity.getComponent<MeshComponent>('mesh');
        meshComp.object.x = transform.x;
        meshComp.object.y = transform.z;
        // Negate rotationY because PixiJS rotation is clockwise, Three.js Y is counter-clockwise
        meshComp.object.rotation = -transform.rotationY;
      }
    }
  }
}
