import { describe, it, expect } from 'vitest';
import { Entity, World, System, Component } from '../src/core/ECS';

interface PositionComponent extends Component {
  type: 'position';
  x: number;
  y: number;
}

interface HealthComponent extends Component {
  type: 'health';
  hp: number;
}

describe('Entity', () => {
  it('should generate unique IDs', () => {
    const a = new Entity();
    const b = new Entity();
    expect(a.id).not.toBe(b.id);
  });

  it('should add and retrieve components', () => {
    const entity = new Entity();
    const pos: PositionComponent = { type: 'position', x: 10, y: 20 };
    entity.addComponent(pos);

    expect(entity.hasComponent('position')).toBe(true);
    expect(entity.getComponent<PositionComponent>('position').x).toBe(10);
  });

  it('should report hasComponents correctly', () => {
    const entity = new Entity();
    entity.addComponent({ type: 'position', x: 0, y: 0 } as PositionComponent);
    entity.addComponent({ type: 'health', hp: 100 } as HealthComponent);

    expect(entity.hasComponents('position', 'health')).toBe(true);
    expect(entity.hasComponents('position', 'missing')).toBe(false);
  });

  it('should remove components', () => {
    const entity = new Entity();
    entity.addComponent({ type: 'position', x: 0, y: 0 } as PositionComponent);
    entity.removeComponent('position');
    expect(entity.hasComponent('position')).toBe(false);
  });
});

describe('World', () => {
  it('should add entities and query by components', () => {
    const world = new World();
    const e1 = new Entity();
    e1.addComponent({ type: 'position', x: 0, y: 0 } as PositionComponent);
    e1.addComponent({ type: 'health', hp: 100 } as HealthComponent);

    const e2 = new Entity();
    e2.addComponent({ type: 'position', x: 5, y: 5 } as PositionComponent);

    world.addEntity(e1);
    world.addEntity(e2);

    const withBoth = world.getEntitiesWithComponents('position', 'health');
    expect(withBoth.length).toBe(1);
    expect(withBoth[0].id).toBe(e1.id);

    const withPos = world.getEntitiesWithComponents('position');
    expect(withPos.length).toBe(2);
  });

  it('should remove destroyed entities on update', () => {
    const world = new World();
    const e1 = new Entity();
    e1.addComponent({ type: 'position', x: 0, y: 0 } as PositionComponent);
    world.addEntity(e1);

    world.removeEntity(e1);
    world.update(0.016);

    expect(world.getEntitiesWithComponents('position').length).toBe(0);
  });

  it('should run systems with matching entities', () => {
    const world = new World();
    const entity = new Entity();
    entity.addComponent({ type: 'position', x: 0, y: 0 } as PositionComponent);
    world.addEntity(entity);

    let updateCount = 0;
    const testSystem: System = {
      requiredComponents: ['position'],
      update(entities: Entity[]) {
        updateCount += entities.length;
      },
    };
    world.addSystem(testSystem);
    world.update(0.016);

    expect(updateCount).toBe(1);
  });
});
