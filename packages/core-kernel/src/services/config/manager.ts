import { IConfigLoader } from "../../contracts/kernel/config";
import { AbstractManager } from "../../support/manager";
import { Local, Remote } from "./drivers";

/**
 * @export
 * @class ConfigManager
 * @extends {AbstractManager<IConfigLoader>}
 */
export class ConfigManager extends AbstractManager<IConfigLoader> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<IConfigLoader>}
     * @memberof ConfigManager
     */
    public async createLocalDriver(): Promise<IConfigLoader> {
        return this.app.build(Local);
    }

    /**
     * Create an instance of the Remote driver.
     *
     * @returns {Promise<IConfigLoader>}
     * @memberof ConfigManager
     */
    public async createRemoteDriver(): Promise<IConfigLoader> {
        return this.app.build(Remote);
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
