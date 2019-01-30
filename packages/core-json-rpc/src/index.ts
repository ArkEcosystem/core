import { AbstractServiceProvider } from "@arkecosystem/core-container";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";
import { database } from "./server/services/database";
import { network } from "./server/services/network";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const logger = this.app.resolve<Logger.ILogger>("logger");

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
            this.app.resolve<Logger.ILogger>("logger").info("Stopping JSON-RPC Server");

            return this.app.resolve("json-rpc").stop();
        }
    }

    public getAlias(): string {
        return "json-rpc";
    }
}
