import { PackageJson } from "type-fest";
import { Kernel } from "../contracts";

export abstract class AbstractServiceProvider {
    /**
     * @protected
     * @type {Kernel.IApplication}
     * @memberof AbstractServiceProvider
     */
    protected app: Kernel.IApplication;

    /**
     * @protected
     * @type {Record<string, any>}
     * @memberof AbstractServiceProvider
     */
    protected opts: Record<string, any>;

    /**
     * @param {Kernel.IApplication} app
     * @param {Record<string, any>} [opts={}]
     * @memberof AbstractServiceProvider
     */
    public constructor(app: Kernel.IApplication, opts: Record<string, any> = {}) {
        this.app = app;
        this.opts = opts;
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
     * @returns {Record<string, any>}
     * @memberof AbstractServiceProvider
     */
    public getDefaults(): Record<string, any> {
        return {};
    }

    /**
     * @returns {string[]}
     * @memberof AbstractServiceProvider
     */
    public provides(): string[] {
        return [];
    }

    /**
     * @returns {Record<string, string>}
     * @memberof AbstractServiceProvider
     */
    public depends(): Record<string, string> {
        return {};
    }
}
