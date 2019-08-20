import { BuildResolverOptions, ClassOrFunctionReturning, Resolver } from "awilix";

export interface IContainer {
    /**
     * Resolve the given name from the container.
     *
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof IContainer
     */
    resolve<T = any>(name: string): T;

    /**
     * Register a class within the container.
     *
     * @template T
     * @param {string} name
     * @param {(T | ClassOrFunctionReturning<T>)} concrete
     * @memberof IContainer
     */
    bind<T = any>(name: string, concrete: T | ClassOrFunctionReturning<T>): void;

    /**
     * Register a class within the container.
     *
     * @template T
     * @param {string} name
     * @param {ClassOrFunctionReturning<T>} concrete
     * @memberof IContainer
     */
    singleton<T = any>(name: string, concrete: ClassOrFunctionReturning<T>): void;

    /**
     * Alias a registration to a different name.
     *
     * @param {string} name
     * @param {string} alias
     * @memberof IContainer
     */
    alias(name: string, alias: string): void;

    /**
     * Determine if the given name has been registered.
     *
     * @param {string} name
     * @returns {boolean}
     * @memberof IContainer
     */
    has(name: string): boolean;

    /**
     * Given a class or function, builds it up and returns it.
     *
     * @template T
     * @param {(ClassOrFunctionReturning<T> | Resolver<T>)} targetOrResolver
     * @param {BuildResolverOptions<{}>} [opts]
     * @returns {*}
     * @memberof IContainer
     */
    build<T>(targetOrResolver: ClassOrFunctionReturning<T> | Resolver<T>, opts?: BuildResolverOptions<{}>): any;
}
