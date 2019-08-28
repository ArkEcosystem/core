import { JsonObject } from "../../types";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject, Identifiers } from "../../container";

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

        const config: JsonObject = this.app.get<JsonObject>("config");
        const configRepository: ConfigRepository = new ConfigRepository(config);
        configRepository.set("options", config.options || {});

        this.app.unbind("config"); // @todo avoid binding and unbinding elements, use unique and descriptive names
        this.app.bind<ConfigRepository>(Identifiers.ConfigRepository).toConstantValue(configRepository);
    }
}
