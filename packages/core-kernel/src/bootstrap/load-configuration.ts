import { Kernel } from "../contracts";

/**
 * @export
 * @class LoadConfiguration
 */
export class LoadConfiguration {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof LoadConfiguration
     */
    public async bootstrap(app: Kernel.IApplication): Promise<void> {
        await app.resolve("configLoader").loadConfiguration();
    }
}
