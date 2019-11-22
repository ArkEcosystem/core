export type FactoryFunctionOptions = Record<string, any>;

export type FactoryFunction<T> = ({ entity, options }: { entity?: T; options: FactoryFunctionOptions }) => T;

export type HookFunction<T> = ({ entity, options }: { entity?: T; options: FactoryFunctionOptions }) => void;
