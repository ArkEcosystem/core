import { PackageJson } from "type-fest";
import { Kernel } from "../contracts";
import { ConfigObject } from "../types";

export abstract class AbstractServiceProvider {
    /**
     * @protected
     * @type {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    protected opts: ConfigObject;

    /**
     * @param {Kernel.IApplication} app
     * @param {ConfigObject} [opts={}]
     * @memberof AbstractServiceProvider
     */
    public constructor(protected readonly app: Kernel.IApplication, opts: ConfigObject = {}) {
        this.opts = this.buildConfig(opts);
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public abstract async register(): Promise<void>;

    /**
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public async boot(): Promise<void> {
        // do nothing by default...
    }

    /**
     * @returns {Promise<void>}
     * @memberof AbstractServiceProvider
     */
    public async dispose(): Promise<void> {
        // do nothing by default...
    }

    /**
     * @abstract
     * @returns {PackageJson}
     * @memberof AbstractServiceProvider
     */
    public abstract getPackageJson(): PackageJson;

    /**
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public getName(): string {
        return this.getPackageJson().name;
    }

    /**
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public getVersion(): string {
        return this.getPackageJson().version;
    }

    /**
     * @returns {ConfigObject}
     * @memberof AbstractServiceProvider
     */
    public getDefaults(): ConfigObject {
        return {};
    }

    /**
     * @returns {Record<string, string>}
     * @memberof AbstractServiceProvider
     */
    public depends(): Record<string, string> {
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

        const globalOptions: ConfigObject | undefined = this.app.config("options")[this.getName()];

        if (globalOptions) {
            this.opts = { ...this.opts, ...globalOptions };
        }

        return opts;
    }
}
