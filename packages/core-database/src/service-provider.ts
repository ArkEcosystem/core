import { AbstractServiceProvider } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { DatabaseManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.resolve<Logger.ILogger>("logger").info("Starting Database Manager");

        this.app.bind(this.getAlias(), new DatabaseManager());
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }
}
