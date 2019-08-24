import { FunctionReturning } from "awilix";

export class Action<T> {
    /**
     * @private
     * @type {Set<FunctionReturning<void>>}
     * @memberof Action
     */
    private readonly beforeHooks: Set<FunctionReturning<void>> = new Set<FunctionReturning<void>>();

    /**
     * @private
     * @type {Set<FunctionReturning<void>>}
     * @memberof Action
     */
    private readonly errorHooks: Set<FunctionReturning<void>> = new Set<FunctionReturning<void>>();

    /**
     * @private
     * @type {Set<FunctionReturning<void>>}
     * @memberof Action
     */
    private readonly afterHooks: Set<FunctionReturning<void>> = new Set<FunctionReturning<void>>();

    /**
     * @param {FunctionReturning<void>} fn
     * @memberof Action
     */
    public constructor(private readonly fn: FunctionReturning<T>) {}

    /**
     * @returns {FunctionReturning<void>}
     * @memberof Action
     */
    public execute(...args: any[]): T {
        return this.fn(args);
    }

    /**
     * @param {FunctionReturning<void>} fn
     * @memberof Action
     */
    public before(fn: FunctionReturning<void>): this {
        this.beforeHooks.add(fn);

        return this;
    }

    /**
     * @param {FunctionReturning<void>} fn
     * @memberof Action
     */
    public error(fn: FunctionReturning<void>): this {
        this.errorHooks.add(fn);

        return this;
    }

    /**
     * @param {FunctionReturning<void>} fn
     * @memberof Action
     */
    public after(fn: FunctionReturning<void>): this {
        this.afterHooks.add(fn);

        return this;
    }

    /**
     * @param {string} type
     * @returns {Set<FunctionReturning<void>>}
     * @memberof Action
     */
    public hooks(type: string): Set<FunctionReturning<void>> {
        return this[`${type}Hooks`];
    }
}
