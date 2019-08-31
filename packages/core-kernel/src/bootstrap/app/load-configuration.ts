import { Identifiers, inject, injectable } from "../../container";
import { Application } from "../../contracts/kernel";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { Bootstrapper } from "../interfaces";

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
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof LoadConfiguration
     */
    public async bootstrap(): Promise<void> {
        await this.app
            .get<ConfigManager>(Identifiers.ConfigManager)
            .driver(this.app.get<ConfigRepository>(Identifiers.ConfigRepository).get<string>("configLoader", "local"))
            .loadConfiguration();
    }
}
