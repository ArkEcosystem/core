import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";

/**
 * @export
 * @class RegisterBaseBindings
 * @implements {IBootstrapper}
 */
@injectable()
export class RegisterBaseBindings implements IBootstrapper {
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
     * @memberof RegisterBaseBindings
     */
    public async bootstrap(): Promise<void> {
        this.app.ioc.bind<string>("app.env").toConstantValue(this.app.config("env"));
        this.app.ioc.bind<string>("app.token").toConstantValue(this.app.config("token"));
        this.app.ioc.bind<string>("app.network").toConstantValue(this.app.config("network"));
        this.app.ioc.bind<string>("app.version").toConstantValue(this.app.config("version"));

        // @todo: implement a getter/setter that sets vars locally and in the process.env variables
        process.env.CORE_ENV = this.app.config("env");
        process.env.NODE_ENV = process.env.CORE_ENV;
        process.env.CORE_TOKEN = this.app.config("token");
        process.env.CORE_NETWORK_NAME = this.app.config("network");
        process.env.CORE_VERSION = this.app.config("version");
    }
}
