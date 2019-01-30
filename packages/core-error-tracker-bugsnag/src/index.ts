import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import bugsnag from "@bugsnag/js";
import { defaults } from "./defaults";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.bind(this.getAlias(), bugsnag(this.opts));
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
