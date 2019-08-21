import { Cache, Events, Filesystem, Log, Queue } from "../../services";
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

        await new Log.ServiceProvider(this.app).register();

        await new Filesystem.ServiceProvider(this.app).register();

        await new Cache.ServiceProvider(this.app).register();

        await new Queue.ServiceProvider(this.app).register();
    }
}
