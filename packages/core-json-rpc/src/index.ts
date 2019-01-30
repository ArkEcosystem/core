import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { startServer } from "./server";
import { database } from "./server/services/database";
import { network } from "./server/services/network";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const logger = this.app.logger;

        if (!this.opts.enabled) {
            logger.info("JSON-RPC Server is disabled :grey_exclamation:");

            return;
        }

        database.init(this.opts.database);

        await network.init();

        return startServer(this.opts);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.logger.info("Stopping JSON-RPC Server");

            return this.app.resolve("json-rpc").stop();
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
