import get from "get-value";
import has from "has-value";
import set from "set-value";
import unset from "unset-value";

/**
 * A Key-Value pair store with support for dot notation keys.
 *
 * @export
 * @class KeyValuePair
 * @template TValue
 */
export class KeyValuePair<TValue> {
    /**
     * @private
     * @type {Record<string, TValue>}
     * @memberof KeyValuePair
     */
    private items: Record<string, TValue> = {};

    /**
     * @returns {Record<string, TValue>}
     * @memberof KeyValuePair
     */
    public all(): Record<string, TValue> {
        return this.items;
    }

    /**
     * @returns {[string, TValue][]}
     * @memberof KeyValuePair
     */
    public entries(): [string, TValue][] {
        return Object.entries(this.items);
    }

    /**
     * @returns {string[]}
     * @memberof KeyValuePair
     */
    public keys(): string[] {
        return Object.keys(this.items);
    }

    /**
     * @returns {TValue[]}
     * @memberof KeyValuePair
     */
    public values(): TValue[] {
        return Object.values(this.items);
    }

    /**
     * @param {string} key
     * @param {TValue} [defaultValue]
     * @returns {TValue}
     * @memberof KeyValuePair
     */
    public get(key: string, defaultValue?: TValue): TValue {
        return get(this.items, key, defaultValue);
    }

    /**
     * @param {string} key
     * @param {TValue} value
     * @returns {TValue}
     * @memberof KeyValuePair
     */
    public set(key: string, value: TValue): TValue {
        return set(this.items, key, value);
    }

    /**
     * @param {string} key
     * @returns {TValue}
     * @memberof KeyValuePair
     */
    public has(key: string): TValue {
        return has(this.items, key);
    }

    /**
     * @param {string} key
     * @returns {TValue}
     * @memberof KeyValuePair
     */
    public unset(key: string): TValue {
        return unset(this.items, key);
    }

    /**
     * @param {Record<string, TValue>} items
     * @memberof KeyValuePair
     */
    public merge(items: Record<string, TValue>): void {
        this.items = { ...this.items, ...items };
    }
}
