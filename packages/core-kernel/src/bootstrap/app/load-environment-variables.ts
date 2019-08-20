import { JsonObject } from "type-fest";
import { ConfigManager } from "../../services/config";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadEnvironmentVariables
 */
export class LoadEnvironmentVariables extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(): Promise<void> {
        const config: JsonObject = this.app.resolve<JsonObject>("config");

        await (await this.app
            .resolve<ConfigManager>("configManager")
            .driver((config.configLoader || "local") as string)).loadEnvironmentVariables();
    }
}
