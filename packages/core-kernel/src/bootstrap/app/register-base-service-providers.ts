import { Actions, Cache, Filesystem, Log, Queue, Validation } from "../../services";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../ioc";

/**
 * @export
 * @class RegisterBaseServiceProviders
 * @implements {IBootstrapper}
 */
@injectable()
export class RegisterBaseServiceProviders implements IBootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof Local
     */
    @inject("app")
    private readonly app: IApplication;

    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseServiceProviders
     */
    public async bootstrap(): Promise<void> {
        await this.app.ioc.resolve(Actions.ServiceProvider).register();

        await this.app.ioc.resolve(Log.ServiceProvider).register();

        await this.app.ioc.resolve(Filesystem.ServiceProvider).register();

        await this.app.ioc.resolve(Cache.ServiceProvider).register();

        await this.app.ioc.resolve(Queue.ServiceProvider).register();

        await this.app.ioc.resolve(Validation.ServiceProvider).register();
    }
}
