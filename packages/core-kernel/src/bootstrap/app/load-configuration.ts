import { ConfigManager, ConfigRepository } from "../../services/config";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";

/**
 * @export
 * @class LoadConfiguration
 * @implements {Bootstrapper}
 */
@injectable()
export class LoadConfiguration implements Bootstrapper {
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
     * @memberof LoadConfiguration
     */
    public async bootstrap(): Promise<void> {
        await this.app
            .get<ConfigManager>("configManager")
            .driver(this.app.get<ConfigRepository>("config").get<string>("configLoader", "local"))
            .loadConfiguration();
    }
}
