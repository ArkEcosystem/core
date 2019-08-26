import { get } from "dottie";
import { PackageJson } from "type-fest";
import { injectable } from "../ioc";

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
        if (!this.manifest) {
            this.manifest = require(`${name}/package.json`);
        }

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
        if (!this.has(key)) {
            return defaultValue;
        }

        return get(this.manifest, key, defaultValue) as T;
    }

    /**
     * Determine if the given manifest value exists.
     *
     * @param {string} key
     * @returns {boolean}
     * @memberof PackageManifest
     */
    public has(key: string): boolean {
        return !!get(this.manifest, key);
    }
}
