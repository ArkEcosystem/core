import { PackageJson } from "type-fest";
import { Kernel } from "../contracts";
import { ConfigObject } from "../types";

export abstract class AbstractServiceProvider {
    /**
     * The application instance.
     *
     * @protected
     * @type {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    protected opts: ConfigObject;

    /**
     * Create a new service provider instance.
     *
     * @param {Kernel.IApplication} app
     * @param {ConfigObject} [opts={}]
     * @memberof AbstractServiceProvider
     */
    public constructor(protected readonly app: Kernel.IApplication, opts: ConfigObject = {}) {
        this.opts = this.buildConfig(opts);
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
        // ...
    }

    /**
     * Dispose the service provider.
     *
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public async dispose(): Promise<void> {
        // ...
    }

    /**
     * Get the manifest of the service provider.
     *
     * @abstract
     * @returns {PackageJson}
     * @memberof AbstractServiceProvider
     */
    public abstract manifest(): PackageJson;

    /**
     * Get the name of the service provider.
     *
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public name(): string {
        return this.manifest().name;
    }

    /**
     * Get the version of the service provider.
     *
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public version(): string {
        return this.manifest().version;
    }

    /**
     * Get the default configuration of the service provider.
     *
     * @returns {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    public defaults(): ConfigObject {
        return {};
    }

    /**
     * Get the dependencies of the service provider.
     *
     * @returns {Kernel.IServiceProviderDependency[]}
     * @memberof AbstractServiceProvider
     */
    public dependencies(): Kernel.IServiceProviderDependency[] {
        return [];
    }

    /**
     * Get the services provided by the provider.
     *
     * @returns {string[]}
     * @memberof AbstractServiceProvider
     */
    public provides(): string[] {
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
     * @protected
     * @param {ConfigObject} opts
     * @returns {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    protected buildConfig(opts: ConfigObject): ConfigObject {
        opts = { ...opts, ...this.defaults() };

        const globalOptions: ConfigObject | undefined = this.app.config("options")[this.name()];

        if (globalOptions) {
            opts = { ...opts, ...globalOptions };
        }

        return opts;
    }
}
