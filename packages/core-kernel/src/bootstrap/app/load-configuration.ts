import { ConfigManager, ConfigRepository } from "../../services/config";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";

/**
 * @export
 * @class LoadConfiguration
 * @implements {IBootstrapper}
 */
@injectable()
export class LoadConfiguration implements IBootstrapper {
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
     * @memberof LoadConfiguration
     */
    public async bootstrap(): Promise<void> {
        await this.app.ioc
            .get<ConfigManager>("configManager")
            .driver(this.app.ioc.get<ConfigRepository>("config").get<string>("configLoader", "local"))
            .loadConfiguration();
    }
}
