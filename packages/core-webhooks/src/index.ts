import { Contracts } from "@arkecosystem/core-kernel";
import { Support } from "@arkecosystem/core-kernel";
import { database } from "./database";
import { defaults } from "./defaults";
import { webhookManager } from "./manager";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const logger = this.app.logger;

        if (!this.opts.enabled) {
            logger.info("Webhooks are disabled :grey_exclamation:");

            return;
        }

        await database.setUp(this.opts.database);

        await webhookManager.setUp();

        if (this.opts.server.enabled) {
            return startServer(this.opts.server);
        }

        logger.info("Webhooks API server is disabled :grey_exclamation:");
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        if (this.opts.server.enabled) {
            this.app.logger.info("Stopping Webhook API");

            return this.app.resolve("webhooks").stop();
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
