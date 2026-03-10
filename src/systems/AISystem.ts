import type { Entity, System } from '../core/ECS';
import type { TransformComponent } from '../components/TransformComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { AIPatrolComponent } from '../components/AIPatrolComponent';
import { distanceSq } from '../utils/math';
import { EventBus } from '../core/EventBus';

export class AISystem implements System {
  readonly requiredComponents = ['transform', 'velocity', 'ai_patrol'];

  constructor(
    private getPlayerPosition: () => { x: number; z: number },
    private eventBus: EventBus
  ) {}

  update(entities: Entity[], dt: number): void {
    const playerPos = this.getPlayerPosition();

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      const patrol = entity.getComponent<AIPatrolComponent>('ai_patrol');

      // Skip defeated enemies
      if (patrol.state === 'defeated') {
        velocity.vx = 0;
        velocity.vz = 0;
        continue;
      }

      // Update chase cooldown
      if (patrol.chaseCooldown > 0) {
        patrol.chaseCooldown -= dt;
      }

      const distToPlayer = Math.sqrt(
        distanceSq(transform.x, transform.z, playerPos.x, playerPos.z)
      );

      // State transitions
      if (patrol.state === 'patrol' && distToPlayer < patrol.aggroRadius && patrol.chaseCooldown <= 0) {
        patrol.state = 'chase';
      } else if (patrol.state === 'chase' && distToPlayer > patrol.aggroRadius * 1.5) {
        patrol.state = 'returning';
        patrol.chaseCooldown = 10; // 10 second cooldown before re-aggro
      } else if (patrol.state === 'returning') {
        const wp = patrol.waypoints[patrol.currentWaypointIndex];
        if (distanceSq(transform.x, transform.z, wp.x, wp.z) < 4) {
          patrol.state = 'patrol';
        }
      }

      let targetX: number;
      let targetZ: number;

      if (patrol.state === 'chase') {
        targetX = playerPos.x;
        targetZ = playerPos.z;
      } else {
        const wp = patrol.waypoints[patrol.currentWaypointIndex];
        targetX = wp.x;
        targetZ = wp.z;

        // Check if reached waypoint
        if (
          patrol.state === 'patrol' &&
          distanceSq(transform.x, transform.z, wp.x, wp.z) <
            patrol.waypointThreshold * patrol.waypointThreshold
        ) {
          // Idle pause at waypoints
          if (patrol.idlePauseDuration <= 0) {
            patrol.idlePauseDuration = 2 + Math.random() * 3; // 2-5 seconds
            patrol.idlePauseTimer = 0;
          }
          patrol.idlePauseTimer += dt;
          if (patrol.idlePauseTimer >= patrol.idlePauseDuration) {
            patrol.currentWaypointIndex =
              (patrol.currentWaypointIndex + 1) % patrol.waypoints.length;
            patrol.idlePauseDuration = 0;
            patrol.idlePauseTimer = 0;
          } else {
            // Stay still while pausing
            velocity.vx = 0;
            velocity.vz = 0;
            continue;
          }
        }
      }

      // Steer toward target
      const dx = targetX - transform.x;
      const dz = targetZ - transform.z;
      const targetAngle = Math.atan2(dx, dz);

      // Smooth rotation
      let angleDiff = targetAngle - transform.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), velocity.turnRate * dt);
      transform.rotationY += turnAmount;

      // Move forward
      const speed = patrol.state === 'chase' ? velocity.speed * 1.3 : velocity.speed;
      velocity.vx = Math.sin(transform.rotationY) * speed;
      velocity.vz = Math.cos(transform.rotationY) * speed;
    }
  }
}
