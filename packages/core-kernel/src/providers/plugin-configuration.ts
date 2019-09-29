import { get, has, set, unset } from "@arkecosystem/utils";

import { Identifiers, inject, injectable } from "../ioc";
import { ConfigRepository } from "../services/config";
import { JsonObject } from "../types";

// todo: review the implementation
/**
 * @export
 * @class PluginConfiguration
 */
@injectable()
export class PluginConfiguration {
    /**
     * @private
     * @type {ConfigRepository}
     * @memberof RegisterBasePaths
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository: ConfigRepository;

    /**
     * The loaded items.
     *
     * @private
     * @type {JsonObject}
     * @memberof PluginConfiguration
     */
    private items: JsonObject = {};

    /**
     * @param {string} name
     * @param {JsonObject} config
     * @returns {this}
     * @memberof PluginConfiguration
     */
    public from(name: string, config: JsonObject): this {
        this.items = config;

        this.mergeWithGlobal(name);

        return this;
    }

    /**
     * Get the configuration for the given package.
     *
     * @param {string} name
     * @returns {this}
     * @memberof PluginConfiguration
     */
    public discover(name: string): this {
        try {
            this.items = require(`${name}/dist/defaults.js`).defaults;
        } catch {}

        this.mergeWithGlobal(name);

        return this;
    }

    /**
     * Merge the given values.
     *
     * @param {JsonObject} values
     * @returns {this}
     * @memberof PluginConfiguration
     */
    public merge(values: JsonObject): this {
        this.items = { ...this.items, ...values };

        return this;
    }

    /**
     * Get all of the configuration values.
     *
     * @returns {JsonObject}
     * @memberof PluginConfiguration
     */
    public all(): JsonObject {
        return this.items;
    }

    /**
     * Get the specified value.
     *
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof PluginConfiguration
     */
    public get<T>(key?: string, defaultValue?: T): T {
        if (!this.has(key)) {
            return defaultValue;
        }

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
     * @template T
     * @param {string} key
     * @returns {boolean}
     * @memberof ConfigRepository
     */
    public unset<T>(key: string): boolean {
        unset(this.items, key);

        return this.has(key);
    }

    /**
     * Determine if the given value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof PluginConfiguration
     */
    public has(key: string): boolean {
        return has(this.items, key);
    }

    /**
     * @private
     * @param {string} name
     * @memberof PluginConfiguration
     */
    private mergeWithGlobal(name: string): void {
        // @todo: better name for storing pluginOptions
        if (!this.configRepository.has(`app.pluginOptions.${name}`)) {
            return;
        }

        this.merge(this.configRepository.get(`app.pluginOptions.${name}`));
    }
}
