import { Application } from "../../../contracts/kernel";
import { ConfigLoader } from "../../../contracts/kernel/config";
import { inject, Identifiers } from "../../../container";

/**
 * @export
 * @class RemoteConfigLoader
 * @implements {ConfigLoader}
 */
export class RemoteConfigLoader implements ConfigLoader {
    /**
     * The application instance.
     *
     * @protected
     * @type {Application}
     * @memberof Manager
     */
    @inject(Identifiers.Application)
    protected readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof RemoteConfigLoader
     */
    public async loadConfiguration(): Promise<void> {
        // @todo
    }

    /**
     * @returns {Promise<void>}
     * @memberof RemoteConfigLoader
     */
    public async loadEnvironmentVariables(): Promise<void> {
        // @todo
    }
}
