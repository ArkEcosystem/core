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
import { EntryDoesNotExist, InvalidType } from "./errors";

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
     * Resolves the registration with the given name.
     *
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof Container
     */
    public resolve<T = any>(name: string): T {
        if (!this.has(name)) {
            throw new EntryDoesNotExist(name);
        }

        return this.container.resolve<T>(name);
    }

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
    public shared<T = any>(name: string, concrete: ClassOrFunctionReturning<T>): void {
        let binding: BuildResolver<T> & DisposableResolver<T>;

        if (isClass(concrete)) {
            binding = asClass(concrete as Constructor<T>);
        } else if (isFunction(concrete)) {
            binding = asFunction(concrete as FunctionReturning<T>);
        } else {
            throw new InvalidType("shared", "concrete", "class or function", typeof concrete);
        }

        this.container.register(name, binding.singleton());
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
    public call<T>(targetOrResolver: ClassOrFunctionReturning<T> | Resolver<T>, opts?: BuildResolverOptions<{}>) {
        return this.container.build(targetOrResolver, opts);
    }
}
