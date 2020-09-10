import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import {
    Cache,
    Filesystem,
    Log,
    Pipeline,
    ProcessActions,
    Queue,
    Schedule,
    Search,
    Triggers,
    Validation,
} from "../../services";
import { Bootstrapper } from "../interfaces";

/**
 * @export
 * @class RegisterBaseServiceProviders
 * @implements {Bootstrapper}
 */
@injectable()
export class RegisterBaseServiceProviders implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @param {Kernel.Application} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseServiceProviders
     */
    public async bootstrap(): Promise<void> {
        await this.app.resolve(Log.ServiceProvider).register();

        await this.app.resolve(Triggers.ServiceProvider).register();

        await this.app.resolve(Filesystem.ServiceProvider).register();

        await this.app.resolve(Cache.ServiceProvider).register();

        await this.app.resolve(Pipeline.ServiceProvider).register();

        await this.app.resolve(Queue.ServiceProvider).register();

        await this.app.resolve(ProcessActions.ServiceProvider).register();

        await this.app.resolve(Validation.ServiceProvider).register();

        await this.app.resolve(Schedule.ServiceProvider).register();

        await this.app.resolve(Search.ServiceProvider).register();
    }
}
