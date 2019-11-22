export class Action {
    /**
     * @private
     * @type {Set<Function>}
     * @memberof Action
     */
    private readonly beforeHooks: Set<Function> = new Set<Function>();

    /**
     * @private
     * @type {Set<Function>}
     * @memberof Action
     */
    private readonly errorHooks: Set<Function> = new Set<Function>();

    /**
     * @private
     * @type {Set<Function>}
     * @memberof Action
     */
    private readonly afterHooks: Set<Function> = new Set<Function>();

    /**
     * @param {Function} fn
     * @memberof Action
     */
    public constructor(private readonly fn: Function) {}

    /**
     * @returns {Function}
     * @memberof Action
     */
    public execute<T>(...args: any[]): T {
        return this.fn(args);
    }

    /**
     * @param {Function} fn
     * @memberof Action
     */
    public before(fn: Function): this {
        this.beforeHooks.add(fn);

        return this;
    }

    /**
     * @param {Function} fn
     * @memberof Action
     */
    public error(fn: Function): this {
        this.errorHooks.add(fn);

        return this;
    }

    /**
     * @param {Function} fn
     * @memberof Action
     */
    public after(fn: Function): this {
        this.afterHooks.add(fn);

        return this;
    }

    /**
     * @param {string} type
     * @returns {Set<Function>}
     * @memberof Action
     */
    public hooks(type: string): Set<Function> {
        return this[`${type}Hooks`];
    }
}
