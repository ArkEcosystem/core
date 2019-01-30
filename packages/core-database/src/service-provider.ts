import { Support } from "@arkecosystem/core-kernel";
import { DatabaseManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.logger.info("Starting Database Manager");

        this.app.bind(this.getAlias(), new DatabaseManager());
    }

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
