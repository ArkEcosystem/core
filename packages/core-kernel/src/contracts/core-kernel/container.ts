import { BuildResolverOptions, ClassOrFunctionReturning, Resolver } from "awilix";
import { AwilixContainer } from "awilix";

export interface IContainer {
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
     * Resolve the given name from the container.
     *
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof IContainer
     */
    resolve<T = any>(name: string): T;

    /**
     * Disposes this container and it's children, calling the disposer
     * on all disposable registrations and clearing the cache.
     *
     * @remarks
     * Only applies to registrations with `SCOPED` or `SINGLETON` lifetime.
     *
     * @returns {Promise<void>}
     * @memberof Container
     */
    dispose(): Promise<void>;

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
    build<T>(targetOrResolver: ClassOrFunctionReturning<T> | Resolver<T>, opts?: BuildResolverOptions<T>): any;

    /**
     * Creates a scoped container with this one as the parent.
     *
     * @remark
     * By default all scopes are returned as-is and not bound to the container!
     *
     * This is due to the fact that scopes are recommended to be used internally
     * in your plugin to have an isolated container that doesn't pollute the core
     * container and gives you full access to the power of {@link https://github.com/jeffijoe/awilix | awilix}.
     *
     * Use scopes with care as they are completely under your own control, detached from core.
     *
     * @returns {AwilixContainer}
     * @memberof IContainer
     */
    createScope(): AwilixContainer;
}
