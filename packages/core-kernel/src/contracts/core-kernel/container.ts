import { BuildResolverOptions, ClassOrFunctionReturning, Resolver } from "awilix";

export interface IContainer {
    /**
     * Resolve the given name from the container.
     */
    resolve<T = any>(name: string): T;

    /**
     * Register a class within the container.
     */
    bind<T = any>(name: string, concrete: T | ClassOrFunctionReturning<T>): void;

    /**
     * Register a class within the container.
     */
    singleton<T = any>(name: string, concrete: ClassOrFunctionReturning<T>): void;

    /**
     * Alias a registration to a different name.
     */
    alias(name: string, alias: string): void;

    /**
     * Determine if the given name has been registered.
     */
    has(name: string): boolean;

    /**
     * Given a class or function, builds it up and returns it.
     */
    call<T>(targetOrResolver: ClassOrFunctionReturning<T> | Resolver<T>, opts?: BuildResolverOptions<{}>): any;
}
