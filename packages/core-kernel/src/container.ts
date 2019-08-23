import {
    aliasTo,
    asClass,
    asFunction,
    asValue,
    AwilixContainer,
    BuildResolver,
    BuildResolverOptions,
    ClassOrFunctionReturning,
    Constructor,
    createContainer,
    DisposableResolver,
    FunctionReturning,
    Resolver,
} from "awilix";
import { isClass, isFunction } from "typechecker";
import { InvalidBindingName, InvalidType } from "./exceptions/kernel";

/**
 * @export
 * @class Container
 */
export class Container {
    /**
     * The underlying container that holds all registrations.
     *
     * @private
     * @type {AwilixContainer}
     * @memberof Container
     */
    private readonly container: AwilixContainer = createContainer();

    /**
     * @TODO: remove any after initial migration
     *
     * Adds a single registration using a pre-constructed resolver.
     *
     * @template T
     * @param {string} name
     * @param {(T | ClassOrFunctionReturning<T>)} concrete
     * @memberof Container
     */
    public bind<T = any>(name: string, concrete: T | ClassOrFunctionReturning<T>): void {
        if (this.usesReservedBindingName(name)) {
            throw new InvalidBindingName(name);
        }

        let binding: Resolver<T> | BuildResolver<T> & DisposableResolver<T>;

        if (isClass(concrete)) {
            binding = asClass<T>(concrete as Constructor<T>);
        } else if (isFunction(concrete)) {
            binding = asFunction<T>(concrete as FunctionReturning<T>);
        } else {
            binding = asValue<T>(concrete as T);
        }

        this.container.register(name, binding);
    }

    /**
     * @TODO: remove any after initial migration
     *
     * Adds a single registration using a pre-constructed resolver. The registration is always reused
     *
     * @template T
     * @param {string} name
     * @param {ClassOrFunctionReturning<T>} concrete
     * @memberof Container
     */
    public singleton<T = any>(name: string, concrete: ClassOrFunctionReturning<T>): void {
        if (this.usesReservedBindingName(name)) {
            throw new InvalidBindingName(name);
        }

        let binding: BuildResolver<T> & DisposableResolver<T>;

        if (isClass(concrete)) {
            binding = asClass(concrete as Constructor<T>);
        } else if (isFunction(concrete)) {
            binding = asFunction(concrete as FunctionReturning<T>);
        } else {
            throw new InvalidType("singleton", "concrete", "class or function", typeof concrete);
        }

        this.container.register<T>(name, binding.singleton());
    }

    /**
     * Resolves the registration with the given name.
     *
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof Container
     */
    public resolve<T = any>(name: string): T {
        return this.container.resolve<T>(name);
    }

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
    public async dispose(): Promise<void> {
        this.container.dispose();
    }

    /**
     * Resolves to the specified registration.
     *
     * @param {string} name
     * @param {string} alias
     * @memberof Container
     */
    public alias(name: string, alias: string): void {
        this.container.register(alias, aliasTo(name));
    }

    /**
     * Checks if the registration with the given name exists.
     *
     * @param {string} name
     * @returns {boolean}
     * @memberof Container
     */
    public has(name: string): boolean {
        return this.container.has(name);
    }

    /**
     * Given a resolver, class or function, builds it up and returns it.
     * Does not cache it, this means that any lifetime configured in case of passing
     * a resolver will not be used.
     *
     * @template T
     * @param {(ClassOrFunctionReturning<T> | Resolver<T>)} targetOrResolver
     * @param {BuildResolverOptions<{}>} [opts]
     * @returns
     * @memberof Container
     */
    public build<T>(targetOrResolver: ClassOrFunctionReturning<T> | Resolver<T>, opts?: BuildResolverOptions<T>): T {
        return this.container.build<T>(targetOrResolver, opts);
    }

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
     * @memberof Container
     */
    public createScope(): AwilixContainer {
        return this.container.createScope();
    }

    /**
     * @private
     * @param {string} name
     * @returns {boolean}
     * @memberof Container
     */
    private usesReservedBindingName(name: string): boolean {
        if (name.startsWith("scopes.")) {
            return true;
        }

        return false;
    }
}
