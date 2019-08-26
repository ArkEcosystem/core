import { JsonObject } from "type-fest";
import { Kernel } from "../contracts";
import { PackageConfiguration } from "./package-configuration";
import { PackageManifest } from "./package-manifest";
import { inject, injectable } from "../ioc";
import { IApplication } from "../contracts/kernel";

/**
 * @export
 * @abstract
 * @class AbstractServiceProvider
 */
@injectable()
export abstract class AbstractServiceProvider {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.IApplication}
     * @memberof Manager
     */
    protected readonly app: Kernel.IApplication;

    /**
     * The application container.
     *
     * @protected
     * @type {Kernel.IoC.Container}
     * @memberof Manager
     */
    protected readonly ioc: Kernel.IoC.Container;

    /**
     * The application instance.
     *
     * @private
     * @type {PackageConfiguration}
     * @memberof AbstractServiceProvider
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
     * Create a new service provider instance.
     *
     * @param {{ app:Kernel.IApplication }} { app }
     * @memberof Manager
     */
    public constructor(@inject("app") app: IApplication) {
        this.app = app;
        this.ioc = app.ioc;
    }

    /**
     * Register the service provider.
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public abstract async register(): Promise<void>;

    /**
     * Boot the service provider.
     *
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public async boot(): Promise<void> {
        //
    }

    /**
     * Dispose the service provider.
     *
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public async dispose(): Promise<void> {
        //
    }

    /**
     * Get the manifest of the service provider.
     *
     * @returns {PackageManifest}
     * @memberof AbstractServiceProvider
     */
    public manifest(): PackageManifest {
        return this.packageManifest;
    }

    /**
     * Set the manifest of the service provider.
     *
     * @param {PackageManifest} manifest
     * @memberof AbstractServiceProvider
     */
    public setManifest(manifest: PackageManifest): void {
        this.packageManifest = manifest;
    }

    /**
     * Get the name of the service provider.
     *
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public name(): string {
        return this.packageManifest ? this.packageManifest.get("name") : undefined;
    }

    /**
     * Get the version of the service provider.
     *
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public version(): string {
        return this.packageManifest ? this.packageManifest.get("version") : undefined;
    }

    /**
     * Get the configuration of the service provider.
     *
     * @returns {PackageConfiguration}
     * @memberof AbstractServiceProvider
     */
    public config(): PackageConfiguration {
        return this.packageConfiguration;
    }

    /**
     * Set the configuration of the service provider.
     *
     * @param {PackageConfiguration} config
     * @memberof AbstractServiceProvider
     */
    public setConfig(config: PackageConfiguration): void {
        this.packageConfiguration = config;
    }

    /**
     * Get the configuration defaults of the service provider.
     *
     * @returns {JsonObject}
     * @memberof AbstractServiceProvider
     */
    public configDefaults(): JsonObject {
        return {};
    }

    /**
     * Get the configuration schema of the service provider.
     *
     * @returns {object}
     * @memberof AbstractServiceProvider
     */
    public configSchema(): object {
        return {};
    }

    /**
     * Get the dependencies of the service provider.
     *
     * @returns {Kernel.IPackageDependency[]}
     * @memberof AbstractServiceProvider
     */
    public dependencies(): Kernel.IPackageDependency[] {
        return [];
    }

    /**
     * Enable the service provider when the given conditions are met.
     *
     * @returns {Promise<boolean>}
     * @memberof AbstractServiceProvider
     */
    public async enableWhen(): Promise<boolean> {
        return true;
    }

    /**
     * Disable the service provider when the given conditions are met.
     *
     * @returns {Promise<boolean>}
     * @memberof AbstractServiceProvider
     */
    public async disableWhen(): Promise<boolean> {
        return false;
    }

    /**
     * Determine if the package is required, which influences how bootstrapping errors are handled.
     *
     * @returns {Promise<boolean>}
     * @memberof AbstractServiceProvider
     */
    public async required(): Promise<boolean> {
        return false;
    }
}
