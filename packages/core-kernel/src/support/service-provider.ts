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
    public async dispose(): Promise<void> {
        // do nothing by default...
    }

    /**
     * @abstract
     * @returns {Record<string, any>}
     * @memberof AbstractServiceProvider
     */
    public abstract getManifest(): Record<string, any>;

    /**
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public getName(): string {
        return this.getManifest().name;
    }

    /**
     * @returns {string}
     * @memberof AbstractServiceProvider
     */
    public getVersion(): string {
        return this.getManifest().version;
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
