import get from "get-value";
import has from "has-value";

import { injectable } from "../container";
import { PackageJson } from "../types";

/**
 * @export
 * @class PackageManifest
 */
@injectable()
export class PackageManifest {
    /**
     * The loaded manifest.
     *
     * @private
     * @type {PackageJson}
     * @memberof PackageManifest
     */
    private manifest: PackageJson;

    /**
     * Get the manifest for the given package.
     *
     * @param {string} name
     * @returns {this}
     * @memberof PackageManifest
     */
    public discover(name: string): this {
        this.manifest = require(`${name}/package.json`);

        return this;
    }

    /**
     * Get the specified manifest value.
     *
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof PackageManifest
     */
    public get<T>(key: string, defaultValue?: T): T {
        return get(this.manifest, key, defaultValue);
    }

    /**
     * Determine if the given manifest value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof PackageManifest
     */
    public has(key: string): boolean {
        return has(this.manifest, key);
    }
}
