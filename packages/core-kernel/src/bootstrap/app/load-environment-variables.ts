import { Config } from "../../services";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";
import { ConfigRepository } from "../../services/config";

/**
 * @export
 * @class LoadEnvironmentVariables
 * @implements {IBootstrapper}
 */
@injectable()
export class LoadEnvironmentVariables implements IBootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof Local
     */
    @inject("app")
    private readonly app: IApplication;

    /**
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(): Promise<void> {
        const configRepository: ConfigRepository = this.app.ioc.get<ConfigRepository>("config");

        await this.app.ioc
            .get<Config.ConfigManager>("configManager")
            .driver(configRepository.get<string>("configLoader", "local"))
            .loadEnvironmentVariables();
    }
}
