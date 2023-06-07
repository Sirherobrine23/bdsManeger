import EventEmitter from "node:events";

export type EventMap = Record<string, (...args: any[]) => void>;
type EventKey<T extends EventMap> = string & keyof T;

export type defineEvents<T extends EventMap> = T;

export class customEvent<T extends EventMap> extends EventEmitter {
  constructor() {
    super({captureRejections: true});
  }
  on<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  on(eventName: "error", fn: (err: Error) => void): this;
  on(eventName: string, fn: (...args: any) => void): this {
    super.on(eventName, fn);
    return this;
  }

  once<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  once(eventName: "error", fn: (err: Error) => void): this;
  once(eventName: string, fn: (...args: any) => void): this {
    super.once(eventName, fn);
    return this;
  }

  removeListener<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  removeListener(eventName: "error", fn: (err: Error) => void): this;
  removeListener(eventName: string, listener: (...args: any[]) => void): this {
    super.removeListener(eventName, listener);
    return this;
  }

  off<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  off(eventName: "error", fn: (err: Error) => void): this;
  off(eventName: string, listener: (...args: any[]) => void): this {
    super.off(eventName, listener);
    return this;
  }

  removeAllListeners<K extends EventKey<T>>(eventName: K): this;
  removeAllListeners(event?: string): this {
    super.removeAllListeners(event);
    return this;
  }

  emit<K extends EventKey<T>>(eventName: K, ...args: Parameters<T[K]>): boolean;
  emit(name: "error", err: Error): boolean;
  emit(eventName: string, ...args: any): boolean {
    return super.emit(eventName, args);
  }
};

export class versionsStorages<T> extends Map<string, T> {
  get(key: string|number): T {
    if (typeof key === "number") return super.get(Array.from(this.keys()).at(key));
    return super.get(key);
  }
}