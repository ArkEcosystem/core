import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { Server } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.logger.info("Public API is disabled :grey_exclamation:");
            return;
        }

        const server = new Server(this.opts);
        await server.start();

        this.app.bind(this.getAlias(), server);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.logger.info(`Stopping Public API`);

            await this.app.resolve<Server>(this.getAlias()).stop();
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
