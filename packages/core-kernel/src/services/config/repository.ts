import { get, set } from "dottie";
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
     * Get the specified configuration value.
     *
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof ConfigRepository
     */
    public get<T>(key: string, defaultValue?: T): T {
        if (!this.has(key)) {
            return defaultValue;
        }

        return get(this.items, key, defaultValue) as T;
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
     * Determine if the given configuration value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof ConfigRepository
     */
    public has(key: string): boolean {
        return !!get(this.items, key);
    }
}
