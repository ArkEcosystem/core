// import * as Joi from "joi";
import { Application } from "./application";

export abstract class AbstractServiceProvider {
    /**
     *
     */
    protected app: Application;

    /**
     *
     */
    protected opts: Record<string, any>;

    /**
     * Create a new service provider instance.
     */
    public constructor(app: Application, opts: Record<string, any> = {}) {
        this.app = app;
        this.opts = opts;
    }

    /**
     * Register any application services.
     */
    public abstract async register(): Promise<void>;

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        // do nothing by default...
    }

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }

    /**
     * The name of the plugin.
     */
    public getName(): string {
        return this.getManifest().name;
    }

    /**
     * The version of the plugin.
     */
    public getVersion(): string {
        return this.getManifest().version;
    }

    /**
     * The alias of the plugin.
     */
    public getAlias(): string {
        const { core } = this.getManifest();

        return core ? core.alias : this.getName();
    }

    /**
     * The default options of the plugin.
     */
    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return null;
    }

    /**
     * Get the services the provider depends on.
     */
    public depends(): Record<string, string> {
        return null;
    }
}
