import { Identifiers, inject, injectable } from "../container";
import { Kernel } from "../contracts";
import { JsonObject } from "../types";
import { PackageConfiguration } from "./package-configuration";
import { PackageManifest } from "./package-manifest";

/**
 * @export
 * @abstract
 * @class ServiceProvider
 */
@injectable()
export abstract class ServiceProvider {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.Application}
     * @memberof Manager
     */
    @inject(Identifiers.Application)
    protected readonly app: Kernel.Application;

    /**
     * The application instance.
     *
     * @private
     * @type {PackageConfiguration}
     * @memberof ServiceProvider
     */
    private packageConfiguration: PackageConfiguration;

    /**
     * The loaded manifest.
     *
     * @private
     * @type {PackageManifest}
     * @memberof PackageManifest
     */
    private packageManifest: PackageManifest;

    /**
     * Register the service provider.
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public abstract async register(): Promise<void>;

    /**
     * Boot the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        //
    }

    /**
     * Dispose the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async dispose(): Promise<void> {
        //
    }

    /**
     * Get the manifest of the service provider.
     *
     * @returns {PackageManifest}
     * @memberof ServiceProvider
     */
    public manifest(): PackageManifest {
        return this.packageManifest;
    }

    /**
     * Set the manifest of the service provider.
     *
     * @param {PackageManifest} manifest
     * @memberof ServiceProvider
     */
    public setManifest(manifest: PackageManifest): void {
        this.packageManifest = manifest;
    }

    /**
     * Get the name of the service provider.
     *
     * @returns {string}
     * @memberof ServiceProvider
     */
    public name(): string | undefined {
        if (this.packageManifest) {
            return this.packageManifest.get("name");
        }

        return undefined;
    }

    /**
     * Get the version of the service provider.
     *
     * @returns {string}
     * @memberof ServiceProvider
     */
    public version(): string | undefined {
        if (this.packageManifest) {
            return this.packageManifest.get("version");
        }

        return undefined;
    }

    /**
     * Get the configuration of the service provider.
     *
     * @returns {PackageConfiguration}
     * @memberof ServiceProvider
     */
    public config(): PackageConfiguration {
        return this.packageConfiguration;
    }

    /**
     * Set the configuration of the service provider.
     *
     * @param {PackageConfiguration} config
     * @memberof ServiceProvider
     */
    public setConfig(config: PackageConfiguration): void {
        this.packageConfiguration = config;
    }

    /**
     * Get the configuration defaults of the service provider.
     *
     * @returns {JsonObject}
     * @memberof ServiceProvider
     */
    public configDefaults(): JsonObject {
        return {};
    }

    /**
     * Get the configuration schema of the service provider.
     *
     * @returns {object}
     * @memberof ServiceProvider
     */
    public configSchema(): object {
        return {};
    }

    /**
     * Get the dependencies of the service provider.
     *
     * @returns {Kernel.PackageDependency[]}
     * @memberof ServiceProvider
     */
    public dependencies(): Kernel.PackageDependency[] {
        return [];
    }

    /**
     * Enable the service provider when the given conditions are met.
     *
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async enableWhen(): Promise<boolean> {
        return true;
    }

    /**
     * Disable the service provider when the given conditions are met.
     *
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async disableWhen(): Promise<boolean> {
        return false;
    }

    /**
     * Determine if the package is required, which influences how bootstrapping errors are handled.
     *
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        return false;
    }
}
