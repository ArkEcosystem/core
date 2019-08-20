import { JsonObject } from "type-fest";
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
        const config: JsonObject = this.app.resolve<JsonObject>("config");

        this.app.resolve<ConfigRepository>("config").set("options", config.options || {});

        await (await this.app
            .resolve<ConfigManager>("configManager")
            .driver((config.configLoader || "local") as string)).loadConfiguration();
    }
}
