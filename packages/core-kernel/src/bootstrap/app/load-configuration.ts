import { IConfigAdapter } from "../../contracts/core-kernel";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadConfiguration
 */
export class LoadConfiguration extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadConfiguration
     */
    public async bootstrap(): Promise<void> {
        const configRepository: ConfigRepository = this.app.resolve<ConfigRepository>("config");

        const driver: IConfigAdapter = await this.app
            .resolve<ConfigManager>("configManager")
            .driver(configRepository.get<string>("configLoader", "local"));

        await driver.loadConfiguration();
    }
}
