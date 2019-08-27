import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";

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
    @inject("app")
    private readonly app: Application;

    /**
     * @param {Kernel.Application} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseBindings
     */
    public async bootstrap(): Promise<void> {
        this.app.bind<string>("app.env").toConstantValue(this.app.config("env"));
        this.app.bind<string>("app.token").toConstantValue(this.app.config("token"));
        this.app.bind<string>("app.network").toConstantValue(this.app.config("network"));
        this.app.bind<string>("app.version").toConstantValue(this.app.config("version"));

        // @todo: implement a getter/setter that sets vars locally and in the process.env variables
        process.env.CORE_ENV = this.app.config("env");
        process.env.NODE_ENV = process.env.CORE_ENV;
        process.env.CORE_TOKEN = this.app.config("token");
        process.env.CORE_NETWORK_NAME = this.app.config("network");
        process.env.CORE_VERSION = this.app.config("version");
    }
}
