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
        this.app.bind<string>(Identifiers.ApplicationEnvironment).toConstantValue(this.app.config("env"));
        this.app.bind<string>(Identifiers.ApplicationToken).toConstantValue(this.app.config("token"));
        this.app.bind<string>(Identifiers.ApplicationNetwork).toConstantValue(this.app.config("network"));
        this.app.bind<string>(Identifiers.ApplicationVersion).toConstantValue(this.app.config("version"));

        // @todo: implement a getter/setter that sets vars locally and in the process.env variables
        process.env.CORE_ENV = this.app.config("env");
        process.env.NODE_ENV = process.env.CORE_ENV;
        process.env.CORE_TOKEN = this.app.config("token");
        process.env.CORE_NETWORK_NAME = this.app.config("network");
        process.env.CORE_VERSION = this.app.config("version");
    }
}
