import { JsonObject } from "type-fest";
import { Config } from "../../services";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadEnvironmentVariables
 * @extends {AbstractBootstrapper}
 */
export class LoadEnvironmentVariables extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(): Promise<void> {
        const config: JsonObject = this.app.resolve<JsonObject>("config");

        await this.app
            .resolve<Config.ConfigManager>("configManager")
            .driver((config.configLoader || "local") as string)
            .loadEnvironmentVariables();
    }
}
