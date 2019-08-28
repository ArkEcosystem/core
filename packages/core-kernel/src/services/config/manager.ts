import { ConfigLoader } from "../../contracts/kernel/config";
import { Manager } from "../../support/manager";
import { LocalConfigLoader, RemoteConfigLoader } from "./drivers";
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
     * @protected
     * @returns {Promise<ConfigLoader>}
     * @memberof ConfigManager
     */
    protected async createLocalDriver(): Promise<ConfigLoader> {
        return this.app.resolve(LocalConfigLoader);
    }

    /**
     * Create an instance of the Remote driver.
     *
     * @protected
     * @returns {Promise<ConfigLoader>}
     * @memberof ConfigManager
     */
    protected async createRemoteDriver(): Promise<ConfigLoader> {
        return this.app.resolve(RemoteConfigLoader);
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
