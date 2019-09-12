import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { Bootstrapper } from "../interfaces";

/**
 * @export
 * @class RegisterBaseBindings
 * @implements {Bootstrapper}
 */
@injectable()
export class RegisterBaseBindings implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @param {Kernel.Application} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseBindings
     */
    public async bootstrap(): Promise<void> {
        this.app.bind<string>(Identifiers.ApplicationEnvironment).toConstantValue(this.app.config("app.flags.env"));
        this.app.bind<string>(Identifiers.ApplicationToken).toConstantValue(this.app.config("app.flags.token"));
        this.app.bind<string>(Identifiers.ApplicationNetwork).toConstantValue(this.app.config("app.flags.network"));
        this.app.bind<string>(Identifiers.ApplicationVersion).toConstantValue(this.app.config("app.flags.version"));

        // @todo: implement a getter/setter that sets vars locally and in the process.env variables
        process.env.CORE_ENV = this.app.config("app.flags.env");
        // process.env.NODE_ENV = process.env.CORE_ENV;
        process.env.CORE_TOKEN = this.app.config("app.flags.token");
        process.env.CORE_NETWORK_NAME = this.app.config("app.flags.network");
        process.env.CORE_VERSION = this.app.config("app.flags.version");
    }
}
