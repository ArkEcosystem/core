import { Support } from "@arkecosystem/core-kernel";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        Sentry.init(this.opts);

        this.app.bind(this.getAlias(), Sentry);
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
