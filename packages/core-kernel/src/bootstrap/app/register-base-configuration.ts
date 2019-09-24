import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { KeyValuePair } from "../../types";
import { Bootstrapper } from "../interfaces";

/**
 * @export
 * @class RegisterBaseConfiguration
 * @extends {AbstractBootstrapper}
 */
@injectable()
export class RegisterBaseConfiguration implements Bootstrapper {
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
     * The application configuration.
     *
     * @private
     * @type {ConfigRepository}
     * @memberof LoadCryptography
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository: ConfigRepository;

    /**
     * @param {Kernel.Application} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseConfiguration
     */
    public async bootstrap(): Promise<void> {
        this.app
            .bind<ConfigManager>(Identifiers.ConfigManager)
            .to(ConfigManager)
            .inSingletonScope();

        await this.app.get<ConfigManager>(Identifiers.ConfigManager).boot();

        this.configRepository.set("app.flags", this.app.get<KeyValuePair>(Identifiers.ConfigFlags));
        // @todo: better name for storing pluginOptions
        this.configRepository.set("app.pluginOptions", this.app.get<KeyValuePair>(Identifiers.ConfigPlugins));
    }
}
