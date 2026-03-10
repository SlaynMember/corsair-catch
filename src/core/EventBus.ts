export type EventCallback<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventCallback<any>>>();

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<T = unknown>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const globalBus = new EventBus();
