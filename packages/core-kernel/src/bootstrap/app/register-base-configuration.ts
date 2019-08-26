import { JsonObject } from "type-fest";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../ioc";

/**
 * @export
 * @class RegisterBaseConfiguration
 * @extends {AbstractBootstrapper}
 */
@injectable()
export class RegisterBaseConfiguration implements IBootstrapper {
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
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseConfiguration
     */
    public async bootstrap(): Promise<void> {
        this.app.ioc
            .bind<ConfigManager>("configManager")
            .to(ConfigManager)
            .inSingletonScope();

        await this.app.ioc.get<ConfigManager>("configManager").boot();

        const config: JsonObject = this.app.ioc.get<JsonObject>("config");
        const configRepository: ConfigRepository = new ConfigRepository(config);
        configRepository.set("options", config.options || {});

        this.app.ioc.unbind("config");
        this.app.ioc.bind<ConfigRepository>("config").toConstantValue(configRepository);
    }
}
