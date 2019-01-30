// import * as Joi from "joi";
import { Application } from "../application";

export abstract class AbstractServiceProvider {
    /**
     * The application implementation.
     */
    protected app: Application;

    /**
     * The service provider options.
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
    public abstract getManifest(): Record<string, any>;

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
     * Get the services provided by the provider.
     */
    public provides(): string[] {
        return [this.getAlias()];
    }

    /**
     * Get the services the provider depends on.
     */
    public depends(): Record<string, string> {
        return null;
    }
}
