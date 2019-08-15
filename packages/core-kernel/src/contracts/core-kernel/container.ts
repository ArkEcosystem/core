import { BuildResolverOptions, Constructor, FunctionReturning, Resolver } from "awilix";

export interface IContainer {
    /**
     * Resolve the given name from the container.
     */
    resolve<T = any>(name: string): T;

    /**
     * Register a class within the container.
     */
    bind(name: string, concrete: any): void;

    /**
     * Register a class within the container.
     */
    shared(name: string, concrete: any): void;

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
    call(
        targetOrResolver: FunctionReturning<{}> | Constructor<{}> | Resolver<{}>,
        opts?: BuildResolverOptions<{}>,
    ): any;
}
