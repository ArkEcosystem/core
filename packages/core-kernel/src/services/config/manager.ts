import { IConfigLoader } from "../../contracts/kernel/config";
import { AbstractManager } from "../../support/manager";
import { Local, Remote } from "./drivers";
import { injectable } from "../../container";

/**
 * @export
 * @class ConfigManager
 * @extends {AbstractManager<IConfigLoader>}
 */
@injectable()
export class ConfigManager extends AbstractManager<IConfigLoader> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<IConfigLoader>}
     * @memberof ConfigManager
     */
    public async createLocalDriver(): Promise<IConfigLoader> {
        return this.app.ioc.resolve(Local);
    }

    /**
     * Create an instance of the Remote driver.
     *
     * @returns {Promise<IConfigLoader>}
     * @memberof ConfigManager
     */
    public async createRemoteDriver(): Promise<IConfigLoader> {
        return this.app.ioc.resolve(Remote);
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof ConfigManager
     */
    protected getDefaultDriver(): string {
        return "local";
    }
}
