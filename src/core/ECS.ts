export interface Component {
  readonly type: string;
}

export class Entity {
  static nextId = 0;
  readonly id: number;
  readonly components = new Map<string, Component>();
  destroyed = false;

  constructor() {
    this.id = Entity.nextId++;
  }

  addComponent<T extends Component>(component: T): this {
    this.components.set(component.type, component);
    return this;
  }

  getComponent<T extends Component>(type: string): T {
    return this.components.get(type) as T;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  hasComponents(...types: string[]): boolean {
    return types.every((t) => this.components.has(t));
  }

  removeComponent(type: string): void {
    this.components.delete(type);
  }
}

export interface System {
  readonly requiredComponents: string[];
  update(entities: Entity[], dt: number): void;
  render?(entities: Entity[], interpolation: number): void;
  cleanup?(): void;
}

export class World {
  private entities: Entity[] = [];
  private systems: System[] = [];

  addEntity(entity: Entity): Entity {
    this.entities.push(entity);
    return entity;
  }

  removeEntity(entity: Entity): void {
    entity.destroyed = true;
  }

  getEntitiesWithComponents(...types: string[]): Entity[] {
    return this.entities.filter(
      (e) => !e.destroyed && e.hasComponents(...types)
    );
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(dt: number): void {
    // Remove destroyed entities
    this.entities = this.entities.filter((e) => !e.destroyed);

    for (const system of this.systems) {
      const matching = this.getEntitiesWithComponents(
        ...system.requiredComponents
      );
      system.update(matching, dt);
    }
  }

  render(interpolation: number): void {
    for (const system of this.systems) {
      if (system.render) {
        const matching = this.getEntitiesWithComponents(
          ...system.requiredComponents
        );
        system.render(matching, interpolation);
      }
    }
  }

  cleanup(): void {
    for (const system of this.systems) {
      system.cleanup?.();
    }
    this.entities = [];
    this.systems = [];
  }
}
