import {
    aliasTo,
    asClass,
    asFunction,
    asValue,
    AwilixContainer,
    BuildResolverOptions,
    Constructor,
    createContainer,
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
     * @private
     * @type {AwilixContainer}
     * @memberof Container
     */
    private readonly container: AwilixContainer = createContainer();

    /**
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
     * @param {string} name
     * @param {*} concrete
     * @memberof Container
     */
    public bind(name: string, concrete: any): void {
        if (isClass(concrete)) {
            concrete = asClass(concrete);
        } else if (isFunction(concrete)) {
            concrete = asFunction(concrete);
        } else {
            concrete = asValue(concrete);
        }

        this.container.register(name, concrete);
    }

    /**
     * @param {string} name
     * @param {*} concrete
     * @memberof Container
     */
    public shared(name: string, concrete: any): void {
        if (isClass(concrete)) {
            concrete = asClass(concrete);
        } else if (isFunction(concrete)) {
            concrete = asFunction(concrete);
        } else {
            throw new InvalidType("shared", "concrete", "class or function", typeof concrete);
        }

        this.container.register(name, concrete.singleton());
    }

    /**
     * @param {string} name
     * @param {string} alias
     * @memberof Container
     */
    public alias(name: string, alias: string): void {
        this.container.register(alias, aliasTo(name));
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof Container
     */
    public has(name: string): boolean {
        return this.container.has(name);
    }

    /**
     * @param {(FunctionReturning<{}> | Constructor<{}> | Resolver<{}>)} targetOrResolver
     * @param {BuildResolverOptions<{}>} [opts]
     * @returns
     * @memberof Container
     */
    public call(
        targetOrResolver: FunctionReturning<{}> | Constructor<{}> | Resolver<{}>,
        opts?: BuildResolverOptions<{}>,
    ) {
        return this.container.build(targetOrResolver, opts);
    }
}
