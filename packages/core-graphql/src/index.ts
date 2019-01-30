import { AbstractServiceProvider } from "@arkecosystem/core-container";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.resolve<Logger.ILogger>("logger").info("GraphQL API is disabled :grey_exclamation:");
            return;
        }

        return startServer(this.opts);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.resolve<Logger.ILogger>("logger").info("Stopping GraphQL API");

            return this.app.resolve("graphql").stop();
        }
    }

    public getAlias(): string {
        return "graphql";
    }
}
