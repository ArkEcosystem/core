import { Kernel } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { JsonObject } from "../types";
import { PluginConfiguration } from "./plugin-configuration";
import { PluginManifest } from "./plugin-manifest";

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
    protected readonly app!: Kernel.Application;

    /**
     * The application instance.
     *
     * @private
     * @type {PluginConfiguration}
     * @memberof ServiceProvider
     */
    private packageConfiguration!: PluginConfiguration;

    /**
     * The loaded manifest.
     *
     * @private
     * @type {PluginManifest}
     * @memberof PluginManifest
     */
    private packageManifest!: PluginManifest;

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
     * @returns {PluginManifest}
     * @memberof ServiceProvider
     */
    public manifest(): PluginManifest {
        return this.packageManifest;
    }

    /**
     * Set the manifest of the service provider.
     *
     * @param {PluginManifest} manifest
     * @memberof ServiceProvider
     */
    public setManifest(manifest: PluginManifest): void {
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
     * Get the alias of the service provider.
     *
     * @returns {string}
     * @memberof ServiceProvider
     */
    public alias(): string | undefined {
        if (this.packageManifest) {
            return this.packageManifest.get("arkecosystem.core.alias");
        }

        return undefined;
    }

    /**
     * Get the configuration of the service provider.
     *
     * @returns {PluginConfiguration}
     * @memberof ServiceProvider
     */
    public config(): PluginConfiguration {
        return this.packageConfiguration;
    }

    /**
     * Set the configuration of the service provider.
     *
     * @param {PluginConfiguration} config
     * @memberof ServiceProvider
     */
    public setConfig(config: PluginConfiguration): void {
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
     * @returns {Kernel.PluginDependency[]}
     * @memberof ServiceProvider
     */
    public dependencies(): Kernel.PluginDependency[] {
        if (this.packageManifest) {
            return this.packageManifest.get("arkecosystem.core.dependencies", []);
        }

        return [];
    }

    /**
     * Enable the service provider when the given conditions are met.
     *
     * @remarks
     * The [serviceProvider] variable will be undefined unless the [KernelEvent.ServiceProviderBooted]
     * event triggered a state change check in which case the name of the booteed service provider will be
     * passed down to this method as packages might rely on each other being booted in a specific order.
     *
     * @param {string} [serviceProvider]
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async bootWhen(serviceProvider?: string): Promise<boolean> {
        return true;
    }

    /**
     * Disable the service provider when the given conditions are met.
     *
     * @remarks
     * The [serviceProvider] variable will be undefined unless the [KernelEvent.ServiceProviderBooted]
     * event triggered a state change check in which case the name of the booteed service provider will be
     * passed down to this method as packages might rely on each other being booted in a specific order.
     *
     * @param {string} [serviceProvider]
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async disposeWhen(serviceProvider?: string): Promise<boolean> {
        return false;
    }

    /**
     * Determine if the package is required, which influences how bootstrapping errors are handled.
     *
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        if (this.packageManifest) {
            return this.packageManifest.get("arkecosystem.core.required", false);
        }

        return false;
    }

    /**
     * Register the service provider.
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public abstract register(): Promise<void>;
}
