import { Actions, Cache, Filesystem, Log, Queue, Validation } from "../../services";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterBaseServiceProviders
 * @extends {AbstractBootstrapper}
 */
export class RegisterBaseServiceProviders extends AbstractBootstrapper {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseServiceProviders
     */
    public async bootstrap(): Promise<void> {
        await this.app.build(Actions.ServiceProvider).register();

        await this.app.build(Log.ServiceProvider).register();

        await this.app.build(Filesystem.ServiceProvider).register();

        await this.app.build(Cache.ServiceProvider).register();

        await this.app.build(Queue.ServiceProvider).register();

        await this.app.build(Validation.ServiceProvider).register();
    }
}
