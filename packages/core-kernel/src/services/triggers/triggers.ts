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

    public unbind(name: string): Action {
        const trigger = this.triggers.get(name);

        if (!trigger) {
            throw new InvalidArgumentException(`The given trigger [${name}] is not available.`);
        }

        this.triggers.delete(name);

        return trigger;
    }

    public rebind(name: string, action: Action): Action {
        this.unbind(name);

        return this.bind(name, action);
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

    // TODO: Check implementation
    // TODO: Add in documentation: how errors are handled, which data can each hook type expect.
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

        let stage: string = "before";
        let result: T | undefined;
        try {
            await this.callBeforeHooks(name, args);

            stage = "execute";
            result = await this.get(name).execute<T>(args);

            stage = "after";
            await this.callAfterHooks<T>(name, args, result);
        } catch (err) {
            // Handle errors inside error hooks. Rethrow error if there are no error hooks.
            if (this.get(name).hooks("error").size) {
                await this.callErrorHooks(name, args, result, err, stage);
            } else {
                throw err;
            }
        }

        return result;
    }

    /**
     * Call all before hooks for the given trigger in sequence.
     *
     * @private
     * @param {string} type
     * @param {string} trigger
     * @param args
     * @param resultOrError
     * @returns {Promise<void>}
     * @memberof Actions
     */
    private async callBeforeHooks<T>(trigger: string, args: ActionArguments): Promise<void> {
        const hooks: Set<Function> = this.get(trigger).hooks("before");

        for (const hook of [...hooks]) {
            await hook(args);
        }
    }

    /**
     * Call all after hooks for the given trigger in sequence.
     *
     * @private
     * @param {string} trigger
     * @param args
     * @param result
     * @returns {Promise<void>}
     * @memberof Actions
     */
    private async callAfterHooks<T>(trigger: string, args: ActionArguments, result: T): Promise<void> {
        const hooks: Set<Function> = this.get(trigger).hooks("after");

        for (const hook of [...hooks]) {
            await hook(args, result);
        }
    }

    /**
     * Call all error hooks for the given trigger in sequence.
     *
     * @private
     * @param {string} trigger
     * @param args
     * @param result
     * @param err
     * @param stage
     * @returns {Promise<void>}
     * @memberof Actions
     */
    private async callErrorHooks<T>(
        trigger: string,
        args: ActionArguments,
        result: T | undefined,
        err: Error,
        stage: string,
    ): Promise<void> {
        const hooks: Set<Function> = this.get(trigger).hooks("error");

        for (const hook of [...hooks]) {
            await hook(args, result, err, stage);
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
