import { InvalidArgumentException } from "../../exceptions/logic";
import { injectable } from "../../ioc";
import { ActionArguments } from "../../types";
import { assert } from "../../utils";
import { Action } from "./action";

/**
 * @export
 * @class Triggers
 */
@injectable()
export class Triggers {
    /**
     * All of the registered triggers.
     *
     * @private
     * @type {Map<string, Action>}
     * @memberof Actions
     */
    private readonly triggers: Map<string, Action> = new Map<string, Action>();

    /**
     * Register a new trigger.
     *
     * @param {string} name
     * @param {Function} fn
     * @returns {Action}
     * @memberof Actions
     */
    public bind(name: string, action: Action): Action {
        if (this.triggers.has(name)) {
            throw new InvalidArgumentException(`The given trigger [${name}] is already registered.`);
        }

        if (this.usesReservedBindingName(name)) {
            throw new InvalidArgumentException(`The given trigger [${name}] is reserved.`);
        }

        this.triggers.set(name, action);

        return action;
    }

    /**
     * Get an trigger.
     *
     * @param {string} name
     * @returns {Action}
     * @memberof Actions
     */
    public get(name: string): Action {
        this.throwIfActionIsMissing(name);

        const trigger: Action | undefined = this.triggers.get(name);

        assert.defined<Action>(trigger);

        return trigger;
    }

    /**
     * Call an trigger by the given name and execute its hooks in sequence.
     *
     * @template T
     * @param {string} name
     * @param {...Array<any>} args
     * @returns {(Promise<T | undefined>)}
     * @memberof Actions
     */
    public async call<T>(name: string, args: ActionArguments = {}): Promise<T | undefined> {
        this.throwIfActionIsMissing(name);

        await this.callHooks("before", name);

        let result: T | undefined;
        try {
            result = await this.get(name).execute<T>(args);
        } catch {
            await this.callHooks("error", name);
        }

        await this.callHooks("after", name);

        return result;
    }

    /**
     * Call all hooks for the given trigger and type in sequence.
     *
     * @private
     * @param {string} type
     * @param {string} trigger
     * @returns {Promise<void>}
     * @memberof Actions
     */
    private async callHooks(type: string, trigger: string): Promise<void> {
        const hooks: Set<Function> = this.get(trigger).hooks(type);

        if (!hooks.size) {
            return;
        }

        for (const hook of [...hooks]) {
            await hook();
        }
    }

    /**
     * Throw an exception if the given trigger doesn't exist.
     *
     * @private
     * @param {string} name
     * @memberof Actions
     */
    private throwIfActionIsMissing(name: string): void {
        if (!this.triggers.has(name)) {
            throw new InvalidArgumentException(`The given trigger [${name}] is not available.`);
        }
    }

    /**
     * Determine if the given trigger name is reserved.
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
