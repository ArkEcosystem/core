import { Config, Events } from "../../services";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterBaseServiceProviders
 */
export class RegisterBaseServiceProviders extends AbstractBootstrapper {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseServiceProviders
     */
    public async bootstrap(): Promise<void> {
        await new Events.ServiceProvider(this.app).register();

        await new Config.ServiceProvider(this.app).register();
    }
}
