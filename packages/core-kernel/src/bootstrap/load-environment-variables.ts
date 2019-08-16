import { Kernel } from "../contracts";

/**
 * @export
 * @class LoadEnvironmentVariables
 */
export class LoadEnvironmentVariables {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(app: Kernel.IApplication): Promise<void> {
        await app.resolve("configLoader").loadEnvironmentVariables();
    }
}
