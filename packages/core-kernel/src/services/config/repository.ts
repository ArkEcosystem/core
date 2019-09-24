import { get, has, set, unset } from "@arkecosystem/utils";

import { injectable } from "../../ioc";
import { JsonObject, KeyValuePair } from "../../types";

/**
 * @export
 * @class ConfigRepository
 * @extends {Map<string, any>}
 */
@injectable()
export class ConfigRepository {
    /**
     * All of the configuration items.
     *
     * @private
     * @type {JsonObject}
     * @memberof ConfigRepository
     */
    private items: JsonObject = {};

    /**
     * Get all configuration values.
     *
     * @returns {JsonObject}
     * @memberof ConfigRepository
     */
    public all(): JsonObject {
        return this.items;
    }

    /**
     * Get the specified configuration value.
     *
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof ConfigRepository
     */
    public get<T>(key: string, defaultValue?: T): T {
        return get(this.items, key, defaultValue);
    }

    /**
     * Set a given configuration value.
     *
     * @template T
     * @param {string} key
     * @param {T} value
     * @returns {boolean}
     * @memberof ConfigRepository
     */
    public set<T>(key: string, value: T): boolean {
        set(this.items, key, value);

        return this.has(key);
    }

    /**
     * Unset a given configuration value.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof ConfigRepository
     */
    public unset(key: string): boolean {
        unset(this.items, key);

        return this.has(key);
    }

    /**
     * Determine if the given configuration value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof ConfigRepository
     */
    public has(key: string): boolean {
        return has(this.items, key);
    }

    /**
     * Determine if the given configuration values exists.
     *
     * @param {string[]} keys
     * @returns {boolean}
     * @memberof ConfigRepository
     */
    public hasAll(keys: string[]): boolean {
        for (const key of keys) {
            if (!has(this.items, key)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param {KeyValuePair} items
     * @memberof ConfigRepository
     */
    public merge(items: KeyValuePair): void {
        this.items = { ...this.items, ...items };
    }
}
