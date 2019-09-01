import { Identifiers, inject, injectable } from "../../container";
import { Application } from "../../contracts/kernel";
import { ConfigManager, ConfigRepository } from "../../services/config";
import { JsonObject } from "../../types";
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

        this.app
            .bind<ConfigRepository>(Identifiers.ConfigRepository)
            .toConstantValue(new ConfigRepository(this.app.get<JsonObject>(Identifiers.ConfigBootstrap)));
    }
}
