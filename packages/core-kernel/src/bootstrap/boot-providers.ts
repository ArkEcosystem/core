import { Kernel } from "../contracts";

/**
 * @export
 * @class RegisterProviders
 */
export class BootProviders {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(app: Kernel.IApplication): Promise<void> {
        console.log(app);
    }
}
