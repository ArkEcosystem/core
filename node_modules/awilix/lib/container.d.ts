import { GlobWithOptions } from './list-modules';
import { LoadModulesOptions } from './load-modules';
import { Resolver, Constructor, BuildResolverOptions } from './resolvers';
import { InjectionModeType } from './injection-mode';
/**
 * The container returned from createContainer has some methods and properties.
 * @interface AwilixContainer
 */
export interface AwilixContainer {
    /**
     * Options the container was configured with.
     */
    options: ContainerOptions;
    /**
     * The proxy injected when using `PROXY` injection mode.
     * Can be used as-is.
     */
    readonly cradle: any;
    /**
     * Getter for the rolled up registrations that merges the container family tree.
     */
    readonly registrations: RegistrationHash;
    /**
     * Resolved modules cache.
     */
    readonly cache: Map<string | symbol, CacheEntry>;
    /**
     * Creates a scoped container with this one as the parent.
     */
    createScope(): AwilixContainer;
    /**
     * Used by `util.inspect`.
     */
    inspect(depth: number, opts?: any): string;
    /**
     * Binds `lib/loadModules` to this container, and provides
     * real implementations of it's dependencies.
     *
     * Additionally, any modules using the `dependsOn` API
     * will be resolved.
     *
     * @see src/load-modules.ts documentation.
     */
    loadModules(globPatterns: Array<string | GlobWithOptions>, options?: LoadModulesOptions): this;
    /**
     * Adds a single registration that using a pre-constructed resolver.
     */
    register<T>(name: string | symbol, registration: Resolver<T>): this;
    /**
     * Pairs resolvers to registration names and registers them.
     */
    register(nameAndRegistrationPair: NameAndRegistrationPair): this;
    /**
     * Resolves the registration with the given name.
     *
     * @param  {string} name
     * The name of the registration to resolve.
     *
     * @return {*}
     * Whatever was resolved.
     */
    resolve<T>(name: string | symbol, resolveOptions?: ResolveOptions): T;
    /**
     * Checks if the registration with the given name exists.
     *
     * @param {string | symbol} name
     * The name of the registration to resolve.
     *
     * @return {boolean}
     * Whether or not the registration exists.
     */
    has(name: string | symbol): boolean;
    /**
     * Given a resolver, class or function, builds it up and returns it.
     * Does not cache it, this means that any lifetime configured in case of passing
     * a resolver will not be used.
     *
     * @param {Resolver|Class|Function} targetOrResolver
     * @param {ResolverOptions} opts
     */
    build<T>(targetOrResolver: ClassOrFunctionReturning<T> | Resolver<T>, opts?: BuildResolverOptions<T>): T;
    /**
     * Disposes this container and it's children, calling the disposer
     * on all disposable registrations and clearing the cache.
     * Only applies to registrations with `SCOPED` or `SINGLETON` lifetime.
     */
    dispose(): Promise<void>;
}
/**
 * Optional resolve options.
 */
export interface ResolveOptions {
    /**
     * If `true` and `resolve` cannot find the requested dependency,
     * returns `undefined` rather than throwing an error.
     */
    allowUnregistered?: boolean;
}
/**
 * Cache entry.
 */
export interface CacheEntry {
    /**
     * The resolver that resolved the value.
     */
    resolver: Resolver<any>;
    /**
     * The resolved value.
     */
    value: any;
}
/**
 * Register a Registration
 * @interface NameAndRegistrationPair
 */
export interface NameAndRegistrationPair {
    [key: string]: Resolver<any>;
}
/**
 * Function that returns T.
 */
export declare type FunctionReturning<T> = (...args: Array<any>) => T;
/**
 * A class or function returning T.
 */
export declare type ClassOrFunctionReturning<T> = FunctionReturning<T> | Constructor<T>;
/**
 * The options for the createContainer function.
 * @interface ContainerOptions
 */
export interface ContainerOptions {
    require?: (id: string) => any;
    injectionMode?: InjectionModeType;
}
/**
 * Contains a hash of registrations where the name is the key.
 */
export declare type RegistrationHash = Record<string | symbol | number, Resolver<any>>;
/**
 * Resolution stack.
 */
export interface ResolutionStack extends Array<string | symbol> {
}
/**
 * Creates an Awilix container instance.
 *
 * @param {Function} options.require
 * The require function to use. Defaults to require.
 *
 * @param {string} options.injectionMode
 * The mode used by the container to resolve dependencies. Defaults to 'Proxy'.
 *
 * @return {object}
 * The container.
 */
export declare function createContainer(options?: ContainerOptions, parentContainer?: AwilixContainer): AwilixContainer;
