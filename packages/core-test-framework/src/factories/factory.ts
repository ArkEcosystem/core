import { Utils } from "@arkecosystem/core-kernel";
import { strictEqual } from "assert";
import deepmerge from "deepmerge";

import { FactoryFunction, HookFunction } from "./types";

/**
 * @export
 * @class Factory
 */
export class Factory {
    /**
     * @private
     * @type {Map<string, FactoryFunction<unknown>>}
     * @memberof Factory
     */
    private readonly states: Map<string, FactoryFunction<unknown>> = new Map<string, FactoryFunction<unknown>>();

    /**
     * @private
     * @type {Map<string, Set<HookFunction<unknown>>>}
     * @memberof Factory
     */
    private readonly hooks: Map<string, Set<HookFunction<unknown>>> = new Map<string, Set<HookFunction<unknown>>>();

    /**
     * @private
     * @type {{ states: Set<string>; attributes: object; options: object }}
     * @memberof Factory
     */
    private readonly modifiers: { states: Set<string>; attributes: object; options: object } = {
        states: new Set<string>(["default"]),
        attributes: {},
        options: {},
    };

    /**
     * @template T
     * @param {string} state
     * @param {FactoryFunction<T>} fn
     * @returns {boolean}
     * @memberof Factory
     */
    public state<T>(state: string, fn: FactoryFunction<T>): boolean {
        // @ts-ignore - this complains that we can't assign FactoryFunction<T> to FactoryFunction<unknown>
        this.states.set(state, fn);

        return this.states.has(state);
    }

    /**
     * @template T
     * @param {HookFunction<T>} fn
     * @returns {boolean}
     * @memberof Factory
     */
    public afterMaking<T>(fn: HookFunction<T>): boolean {
        return this.afterMakingState("default", fn);
    }

    /**
     * @template T
     * @param {string} state
     * @param {HookFunction<T>} fn
     * @returns {boolean}
     * @memberof Factory
     */
    public afterMakingState<T>(state: string, fn: HookFunction<T>): boolean {
        this.assertKnownState(state);

        return this.registerHook(state, fn);
    }

    /**
     * @param {...string[]} states
     * @returns {this}
     * @memberof Factory
     */
    public withStates(...states: string[]): this {
        for (const state of states) {
            this.assertKnownState(state);

            this.modifiers.states.add(state);
        }

        return this;
    }

    /**
     * @param {object} attributes
     * @returns {this}
     * @memberof Factory
     */
    public withAttributes(attributes: object): this {
        this.modifiers.attributes = attributes;

        return this;
    }

    /**
     * @param {object} options
     * @returns {this}
     * @memberof Factory
     */
    public withOptions(options: object): this {
        this.modifiers.options = options;

        return this;
    }

    /**
     * @template T
     * @param {number} [count=1]
     * @returns {(T | T[])}
     * @memberof Factory
     */
    public make<T>(count: number = 1): T | T[] {
        const entities: T[] = [];

        const states: string[] = [...this.modifiers.states.values()];
        const initialState: string | undefined = states.shift();

        Utils.assert.defined<string>(initialState);

        for (let i = 0; i < count; i++) {
            const fn: FactoryFunction<T> | undefined = this.states.get(initialState) as FactoryFunction<T>;

            strictEqual(fn instanceof Function, true, `Is not a function.`);

            let result: T = fn(undefined, this.modifiers.options);

            this.applyHooks(initialState, result);

            // We apply all states in order of insertion to guarantee consistency.
            for (const state of states) {
                // @ts-ignore - Type 'FactoryFunction<unknown> | undefined' is not assignable to type 'FactoryFunction<T> | undefined'.
                const fn: FactoryFunction<T> | undefined = this.states.get(state);

                Utils.assert.defined<FactoryFunction<T>>(fn);

                result = deepmerge(result, fn(result, this.modifiers.options));

                // We apply all hooks in order of insertion to guarantee consistency.
                this.applyHooks(state, result);
            }

            entities.push(deepmerge(result, this.modifiers.attributes) as T);
        }

        this.resetModifiers();

        return count === 1 ? entities[0] : entities;
    }

    /**
     * @private
     * @template T
     * @param {string} state
     * @param {HookFunction<T>} fn
     * @returns {boolean}
     * @memberof Factory
     */
    private registerHook<T>(state: string, fn: HookFunction<T>): boolean {
        /* istanbul ignore next */
        if (!this.hooks.has(state)) {
            this.hooks.set(state, new Set());
        }

        const hooks: Set<HookFunction<T>> | undefined = this.hooks.get(state);

        Utils.assert.defined<Set<HookFunction<T>>>(hooks);

        hooks.add(fn);

        // @ts-ignore - this complains that we can't assign Set<HookFunction<T>> to Set<HookFunction<unknown>>
        return this.hooks.set(state, hooks);
    }

    /**
     * @private
     * @param {string} state
     * @memberof Factory
     */
    private assertKnownState(state: string): void {
        strictEqual(this.states.has(state), true, `The [${state}] state is unknown.`);
    }

    /**
     * @private
     * @template T
     * @param {string} state
     * @param {T} value
     * @memberof Factory
     */
    private applyHooks<T>(state: string, value: T): void {
        const hooks: Set<HookFunction<T>> | undefined = this.hooks.get(state);

        if (hooks) {
            for (const hook of hooks) {
                hook(value);
            }
        }
    }

    /**
     * @private
     * @memberof Factory
     */
    private resetModifiers(): void {
        this.modifiers.states.clear();
        this.modifiers.states.add("default");

        this.modifiers.options = {};

        this.modifiers.attributes = {};
    }
}
