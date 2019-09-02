import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { Bootstrapper } from "../interfaces";

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
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(): Promise<void> {
        const configRepository: ConfigRepository = this.app.get<ConfigRepository>(Identifiers.ConfigRepository);

        await this.app
            .get<ConfigManager>(Identifiers.ConfigManager)
            .driver(configRepository.get<string>("configLoader", "local"))
            .loadEnvironmentVariables();
    }
}
