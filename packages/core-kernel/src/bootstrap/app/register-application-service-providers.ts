import { Cache, Filesystem, Log, Queue } from "../../services";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterApplicationServiceProviders
 */
export class RegisterApplicationServiceProviders extends AbstractBootstrapper {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterApplicationServiceProviders
     */
    public async bootstrap(): Promise<void> {
        await new Log.ServiceProvider(this.app).register();

        await new Filesystem.ServiceProvider(this.app).register();

        await new Cache.ServiceProvider(this.app).register();

        await new Queue.ServiceProvider(this.app).register();
    }
}
