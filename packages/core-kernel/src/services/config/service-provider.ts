import { JsonObject, PackageJson } from "type-fest";
import { AbstractServiceProvider } from "../../support";
import { ConfigManager } from "./manager";
import { ConfigRepository } from "./repository";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.singleton("configManager", ConfigManager);

        this.app.bind<ConfigRepository>("config", new ConfigRepository(this.app.resolve<JsonObject>("config")));
    }

    /**
     * Get the manifest of the service provider.
     *
     * @returns {PackageJson}
     * @memberof ServiceProvider
     */
    public getPackageJson(): PackageJson {
        return {};
    }
}
