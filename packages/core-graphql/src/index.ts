import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.logger.info("GraphQL API is disabled :grey_exclamation:");
            return;
        }

        return startServer(this.opts);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.logger.info("Stopping GraphQL API");

            return this.app.resolve("graphql").stop();
        }
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
