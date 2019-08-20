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
        // do nothing by default...
    }

    /**
     * Dispose the service provider.
     *
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public async dispose(): Promise<void> {
        // do nothing by default...
    }

    /**
     * Get the manifest of the service provider.
     *
     * @abstract
     * @returns {PackageJson}
     * @memberof AbstractServiceProvider
     */
    public abstract getPackageJson(): PackageJson;

    /**
     * Get the name of the service provider.
     *
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public getName(): string {
        return this.getPackageJson().name;
    }

    /**
     * Get the version of the service provider.
     *
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public getVersion(): string {
        return this.getPackageJson().version;
    }

    /**
     * Get the default of the service provider.
     *
     * @returns {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    public getDefaults(): ConfigObject {
        return {};
    }

    /**
     * Get the dependencies of the service provider.
     *
     * @returns {Record<string, string>}
     * @memberof AbstractServiceProvider
     */
    public getDependencies(): Record<string, string> {
        return {};
    }

    /**
     * @protected
     * @param {ConfigObject} opts
     * @returns {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    protected buildConfig(opts: ConfigObject): ConfigObject {
        opts = { ...opts, ...this.getDefaults() };

        try {
            const globalOptions: ConfigObject | undefined = this.app.config("options")[this.getName()];

            if (globalOptions) {
                this.opts = { ...this.opts, ...globalOptions };
            }
        } catch {
            // ignore global configuration errors
        }

        return opts;
    }
}
