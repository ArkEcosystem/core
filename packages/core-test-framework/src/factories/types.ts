export type FactoryFunction<T> = (entity?: T, options?: object) => T;

export type HookFunction<T> = (entity: T, options?: object) => void;
