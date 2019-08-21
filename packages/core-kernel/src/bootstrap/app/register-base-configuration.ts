import { JsonObject } from "type-fest";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterBaseConfiguration
 */
export class RegisterBaseConfiguration extends AbstractBootstrapper {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseConfiguration
     */
    public async bootstrap(): Promise<void> {
        this.app.singleton("configManager", ConfigManager);

        const config: JsonObject = this.app.resolve<JsonObject>("config");
        const configRepository: ConfigRepository = new ConfigRepository(config);
        configRepository.set("options", config.options || {});

        this.app.bind<ConfigRepository>("config", configRepository);
    }
}
