import { Config } from "../../services";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";
import { ConfigRepository } from "../../services/config";

/**
 * @export
 * @class LoadEnvironmentVariables
 * @implements {Bootstrapper}
 */
@injectable()
export class LoadEnvironmentVariables implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject("app")
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(): Promise<void> {
        const configRepository: ConfigRepository = this.app.get<ConfigRepository>("config");

        await this.app
            .get<Config.ConfigManager>("configManager")
            .driver(configRepository.get<string>("configLoader", "local"))
            .loadEnvironmentVariables();
    }
}
