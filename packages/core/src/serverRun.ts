import EventEmitter from "node:events";

export type EventMap = Record<string, (...args: any[]) => void>;
export type defineEvents<T extends EventMap> = T;
type EventKey<T extends EventMap> = string & keyof T;

export interface customEvent<T extends EventMap> extends EventEmitter {
  emit<K extends EventKey<T>>(eventName: K, ...args: Parameters<T[K]>): boolean;
  emit(name: "error", err: Error): boolean;

  on<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  on(eventName: "error", fn: (err: Error) => void): this;

  prependListener<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  prependListener(eventName: "error", fn: (err: Error) => void): this;

  once<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  once(eventName: "error", fn: (err: Error) => void): this;

  prependOnceListener<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  prependOnceListener(eventName: "error", fn: (err: Error) => void): this;

  removeListener<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  removeListener(eventName: "error", fn: (err: Error) => void): this;

  off<K extends EventKey<T>>(eventName: K, fn: T[K]): this;
  off(eventName: "error", fn: (err: Error) => void): this;

  removeAllListeners<K extends EventKey<T>>(eventName: K): this;
  removeAllListeners(eventName: "error"): this;

  rawListeners<K extends EventKey<T>>(eventName: K): (T[K])[];
  rawListeners(eventName: "error"): ((err: Error) => void)[];

  eventNames(): (EventKey<T> | "error")[];
}

export class customEvent<T extends EventMap> extends EventEmitter {
  constructor() {
    super({captureRejections: true});
  }
};

export class versionsStorages<T> extends Map<string, T> {
  constructor(origem: Record<string, T> = {}) {
    super(Object.keys(origem).map(key => ([key, origem[key]])));
  }

  prettyVersion(serverVersion: string|number): string {
    const checkIsNumber = (arg0: string|number) => typeof arg0 === "number" ? arg0 : Number(arg0).toString() === arg0 ? Number(arg0) : arg0;
    serverVersion = checkIsNumber(serverVersion);
    if (typeof serverVersion === "number") return Array.from(this.keys()).at(serverVersion);
    return serverVersion;
  }

  get(serverVersion: string|number): T {
    return super.get(this.prettyVersion(serverVersion));
  }

  has(serverVersion: string|number): boolean {
    return super.has(this.prettyVersion(serverVersion));
  }

  toJSON() {
    return Array.from(super.keys()).reduce<{[version: string]: T}>((acc, key) => {
      acc[key] = super.get(key);
      return acc;
    }, {});
  }
}