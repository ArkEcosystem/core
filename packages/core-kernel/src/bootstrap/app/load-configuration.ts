import { ConfigManager, ConfigRepository } from "../../services/config";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadConfiguration
 * @extends {AbstractBootstrapper}
 */
export class LoadConfiguration extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadConfiguration
     */
    public async bootstrap(): Promise<void> {
        await this.app
            .resolve<ConfigManager>("configManager")
            .driver(this.app.resolve<ConfigRepository>("config").get<string>("configLoader", "local"))
            .loadConfiguration();
    }
}
