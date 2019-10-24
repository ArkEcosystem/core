import { get, has, set, unset } from "@arkecosystem/utils";
import { strictEqual } from "assert";

import { assert } from "../../utils";
import { AttributeSet } from "./attribute-set";

export class AttributeMap {
    /**
     * @private
     * @type {object}
     * @memberof AttributeMap
     */
    private attributes: object = {};

    /**
     * Creates an instance of AttributeMap.
     *
     * @param {AttributeSet} knownAttributes
     * @memberof AttributeMap
     */
    public constructor(private readonly knownAttributes: AttributeSet) {}

    /**
     * @returns {object}
     * @memberof AttributeMap
     */
    public all(): object {
        return this.attributes;
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {(T | undefined)}
     * @memberof AttributeMap
     */
    public get<T>(key: string, defaultValue?: T): T {
        this.assertKnown(key);

        return assert.defined(get(this.attributes, key, defaultValue));
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} value
     * @returns {boolean}
     * @memberof AttributeMap
     */
    public set<T>(key: string, value: T): boolean {
        this.assertKnown(key);

        set(this.attributes, key, value);

        return this.has(key);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof AttributeMap
     */
    public forget(key: string): boolean {
        this.assertKnown(key);

        unset(this.attributes, key);

        return !this.has(key);
    }

    /**
     * @returns {boolean}
     * @memberof AttributeMap
     */
    public flush(): boolean {
        this.attributes = {};

        return Object.keys(this.attributes).length === 0;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof AttributeMap
     */
    public has(key: string): boolean {
        this.assertKnown(key);

        return has(this.attributes, key);
    }

    /**
     * @private
     * @param {string} key
     * @memberof AttributeMap
     */
    private assertKnown(key: string): void {
        strictEqual(this.knownAttributes.has(key), true, `Unknown attribute: ${key}`);
    }
}
