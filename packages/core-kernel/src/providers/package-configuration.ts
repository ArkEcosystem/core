import { get, set } from "dottie";
import { Kernel } from "../contracts";
import { JsonObject } from "../types";
import { inject, injectable } from "../container";

/**
 * @export
 * @class PackageConfiguration
 */
@injectable()
export class PackageConfiguration {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.Application}
     * @memberof Manager
     */
    private readonly app: Kernel.Application;

    /**
     * The loaded items.
     *
     * @private
     * @type {JsonObject}
     * @memberof PackageConfiguration
     */
    private items: JsonObject;

    /**
     * Create a new package configuration.
     *
     * @param {{ app:Kernel.Application }} { app }
     * @memberof Manager
     */
    public constructor(@inject("app") app: Kernel.Application) {
        this.app = app;
    }

    /**
     * @param {string} name
     * @param {JsonObject} config
     * @returns {this}
     * @memberof PackageConfiguration
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
     * @memberof PackageConfiguration
     */
    public discover(name: string): this {
        if (!this.items) {
            try {
                this.items = require(`${name}/dist/defaults.js`).defaults;
            } catch {
                this.items = {};
            }
        }

        this.mergeWithGlobal(name);

        return this;
    }

    /**
     * Merge the given values.
     *
     * @param {JsonObject} values
     * @returns {this}
     * @memberof PackageConfiguration
     */
    public merge(values: JsonObject): this {
        this.items = { ...this.items, ...values };

        return this;
    }

    /**
     * Get all of the configuration values.
     *
     * @returns {JsonObject}
     * @memberof PackageConfiguration
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
     * @memberof PackageConfiguration
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
     * Determine if the given value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof PackageConfiguration
     */
    public has(key: string): boolean {
        return !!get(this.items, key);
    }

    /**
     * @private
     * @param {string} name
     * @memberof PackageConfiguration
     */
    private mergeWithGlobal(name: string): void {
        const globalOptions: JsonObject | undefined = this.app.config("options")[name];

        if (globalOptions) {
            this.merge(globalOptions);
        }
    }
}
