import { FunctionReturning } from "awilix";
import { Action } from "./action";
import { InvalidArgumentException } from "../../exceptions/logic";

export class Actions {
    /**
     * All of the registered actions.
     *
     * @private
     * @type {Map<string, Action>}
     * @memberof Actions
     */
    private readonly actions: Map<string, Action<unknown>> = new Map<string, Action<unknown>>();

    /**
     * Register a new action.
     *
     * @template T
     * @param {string} name
     * @param {FunctionReturning<T>} fn
     * @returns {Action}
     * @memberof Actions
     */
    public bind<T>(name: string, fn: FunctionReturning<T>): Action<T> {
        if (this.actions.has(name)) {
            throw new InvalidArgumentException(`The given action [${name}] is already registered.`);
        }

        if (this.usesReservedBindingName(name)) {
            throw new InvalidArgumentException(`The given action [${name}] is reserved.`);
        }

        const action: Action<T> = new Action<T>(fn);
        this.actions.set(name, action);

        return action;
    }

    /**
     * Get an action.
     *
     * @param {string} name
     * @returns {Action}
     * @memberof Actions
     */
    public get<T>(name: string): Action<T> {
        this.throwIfActionIsMissing(name);

        return this.actions.get(name) as Action<T>;
    }

    /**
     * Call an action by the given name and execute its hooks in sequence.
     *
     * @template T
     * @param {string} name
     * @param {...Array<any>} args
     * @returns {(Promise<T | undefined>)}
     * @memberof Actions
     */
    public async call<T>(name: string, ...args: Array<any>): Promise<T | undefined> {
        this.throwIfActionIsMissing(name);

        await this.callHooks("before", name);

        let result: T | undefined;
        try {
            result = (await this.actions.get(name).execute(args)) as T;
        } catch {
            await this.callHooks("error", name);
        }

        await this.callHooks("after", name);

        return result;
    }

    /**
     * Call all hooks for the given action and type in sequence.
     *
     * @private
     * @param {string} type
     * @param {string} action
     * @returns {Promise<void>}
     * @memberof Actions
     */
    private async callHooks(type: string, action: string): Promise<void> {
        const hooks: Set<FunctionReturning<void>> = this.actions.get(action).hooks(type);

        if (!hooks.size) {
            return;
        }

        for (const hook of Array.from(hooks)) {
            await hook();
        }
    }

    /**
     * Throw an exception if the given action doesn't exist.
     *
     * @private
     * @param {string} name
     * @memberof Actions
     */
    private throwIfActionIsMissing(name: string): void {
        if (!this.actions.has(name)) {
            throw new InvalidArgumentException(`The given action [${name}] is not available.`);
        }
    }

    /**
     * Determine if the given action name is reserved.
     *
     * @private
     * @param {string} name
     * @returns {boolean}
     * @memberof Container
     */
    private usesReservedBindingName(name: string): boolean {
        const prefixes: string[] = ["internal."];

        for (const prefix of prefixes) {
            if (name.startsWith(prefix)) {
                return true;
            }
        }

        return false;
    }
}
