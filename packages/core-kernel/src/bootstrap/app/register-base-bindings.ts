import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { assert } from "../../utils";
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
    private readonly app!: Application;

    /**
     * @param {Kernel.Application} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseBindings
     */
    public async bootstrap(): Promise<void> {
        const flags: Record<string, string> = assert.defined(this.app.config("app.flags"));

        this.app.bind<string>(Identifiers.ApplicationEnvironment).toConstantValue(flags.env);
        this.app.bind<string>(Identifiers.ApplicationToken).toConstantValue(flags.token);
        this.app.bind<string>(Identifiers.ApplicationNetwork).toConstantValue(flags.network);
        this.app.bind<string>(Identifiers.ApplicationVersion).toConstantValue(flags.version);

        // @todo: implement a getter/setter that sets vars locally and in the process.env variables
        process.env.CORE_ENV = flags.env;
        // process.env.NODE_ENV = process.env.CORE_ENV;
        process.env.CORE_TOKEN = flags.token;
        process.env.CORE_NETWORK_NAME = flags.network;
        process.env.CORE_VERSION = flags.version;
    }
}
