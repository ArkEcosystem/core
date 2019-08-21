import { Kernel } from "../../contracts";
import { AbstractManager } from "../../support/manager";
import { Local, Remote } from "./drivers";

export class ConfigManager extends AbstractManager<Kernel.IConfigAdapter> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<Kernel.IConfigAdapter>}
     * @memberof ConfigManager
     */
    public async createLocalDriver(): Promise<Kernel.IConfigAdapter> {
        return this.app.build(Local);
    }

    /**
     * Create an instance of the Remote driver.
     *
     * @returns {Promise<Kernel.IConfigAdapter>}
     * @memberof ConfigManager
     */
    public async createRemoteDriver(): Promise<Kernel.IConfigAdapter> {
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
