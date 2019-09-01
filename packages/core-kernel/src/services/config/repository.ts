import get from "get-value";
import has from "has-value";
import set from "set-value";
import unset from "unset-value";

import { JsonObject } from "../../types";

/**
 * @export
 * @class ConfigRepository
 * @extends {Map<string, any>}
 */
export class ConfigRepository {
    /**
     * All of the configuration items.
     *
     * @private
     * @type {JsonObject}
     * @memberof ConfigRepository
     */
    private readonly items: JsonObject;

    /**
     * Create a new configuration repository.
     *
     * @param {JsonObject} config
     * @memberof ConfigRepository
     */
    public constructor(config: JsonObject) {
        this.items = config;
    }

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
        return unset(this.items, key);
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
}
