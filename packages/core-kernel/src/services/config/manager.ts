import { ConfigLoader } from "../../contracts/kernel/config";
import { Manager } from "../../support/manager";
import { Local, Remote } from "./drivers";
import { injectable } from "../../container";

/**
 * @export
 * @class ConfigManager
 * @extends {Manager<ConfigLoader>}
 */
@injectable()
export class ConfigManager extends Manager<ConfigLoader> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<ConfigLoader>}
     * @memberof ConfigManager
     */
    public async createLocalDriver(): Promise<ConfigLoader> {
        return this.app.resolve(Local);
    }

    /**
     * Create an instance of the Remote driver.
     *
     * @returns {Promise<ConfigLoader>}
     * @memberof ConfigManager
     */
    public async createRemoteDriver(): Promise<ConfigLoader> {
        return this.app.resolve(Remote);
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
