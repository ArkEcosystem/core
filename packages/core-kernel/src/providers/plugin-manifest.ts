import { get, has } from "@arkecosystem/utils";

import { injectable } from "../ioc";
import { PackageJson } from "../types";

/**
 * @export
 * @class PluginManifest
 */
@injectable()
export class PluginManifest {
    /**
     * The loaded manifest.
     *
     * @private
     * @type {PackageJson}
     * @memberof PluginManifest
     */
    private manifest!: PackageJson;

    /**
     * Get the manifest for the given package.
     *
     * @param {string} packageId
     * @returns {this}
     * @memberof PluginManifest
     */
    public discover(packageId: string): this {
        this.manifest = require(`${packageId}/package.json`);

        return this;
    }

    /**
     * Get the specified manifest value.
     *
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof PluginManifest
     */
    public get<T>(key: string, defaultValue?: T): T {
        return get(this.manifest, key, defaultValue) as T;
    }

    /**
     * Determine if the given manifest value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof PluginManifest
     */
    public has(key: string): boolean {
        return has(this.manifest, key);
    }

    /**
     * @param {PackageJson} manifest
     * @memberof PluginManifest
     */
    public merge(manifest: PackageJson): this {
        this.manifest = { ...this.manifest, ...manifest };

        return this;
    }
}
