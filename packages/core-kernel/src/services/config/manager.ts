import { ConfigLoader } from "../../contracts/kernel/config";
import { injectable } from "../../ioc";
import { Manager } from "../../support/manager";
import { LocalConfigLoader } from "./drivers";

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
