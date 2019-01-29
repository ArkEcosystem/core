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

export class Container {
    /**
     * The current available container.
     */
    private readonly container: AwilixContainer = createContainer();

    /**
     * Resolve the given name from the container.
     */
    public resolve<T = any>(name: string): T {
        if (!this.has(name)) {
            throw new EntryDoesNotExist(name);
        }

        return this.container.resolve<T>(name);
    }

    /**
     * Register a class within the container.
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
     * Register a class within the container.
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
     * Alias a registration to a different name.
     */
    public alias(name: string, alias: string): void {
        this.container.register(alias, aliasTo(name));
    }

    /**
     * Determine if the given name has been registered.
     */
    public has(name: string): boolean {
        return this.container.has(name);
    }

    /**
     * Given a class or function, builds it up and returns it.
     */
    public call(
        targetOrResolver: FunctionReturning<{}> | Constructor<{}> | Resolver<{}>,
        opts?: BuildResolverOptions<{}>,
    ) {
        return this.container.build(targetOrResolver, opts);
    }
}
