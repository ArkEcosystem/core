import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterBaseBindings
 * @extends {AbstractBootstrapper}
 */
export class RegisterBaseBindings extends AbstractBootstrapper {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof RegisterBaseBindings
     */
    public async bootstrap(): Promise<void> {
        this.app.bind("app.env", this.app.config("env"));
        this.app.bind("app.token", this.app.config("token"));
        this.app.bind("app.network", this.app.config("network"));
        this.app.bind("app.version", this.app.config("version"));

        // @TODO: implement a getter/setter that sets vars locally and in the process.env variables
        process.env.CORE_ENV = this.app.config("env");
        process.env.NODE_ENV = process.env.CORE_ENV;
        process.env.CORE_TOKEN = this.app.config("token");
        process.env.CORE_NETWORK_NAME = this.app.config("network");
        process.env.CORE_VERSION = this.app.config("version");
    }
}
