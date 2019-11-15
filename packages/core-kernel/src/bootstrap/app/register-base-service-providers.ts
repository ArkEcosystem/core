import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { Log } from "../../services";
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
    }
}
