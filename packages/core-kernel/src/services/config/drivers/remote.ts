import { Application } from "../../../contracts/kernel";
import { ConfigLoader } from "../../../contracts/kernel/config";
import {
    ApplicationConfigurationCannotBeLoaded,
    EnvironmentConfigurationCannotBeLoaded,
} from "../../../exceptions/config";
import { Identifiers, inject, injectable } from "../../../ioc";

/**
 * @export
 * @class RemoteConfigLoader
 * @implements {ConfigLoader}
 */
@injectable()
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
        throw new ApplicationConfigurationCannotBeLoaded();
    }

    /**
     * @returns {Promise<void>}
     * @memberof RemoteConfigLoader
     */
    public async loadEnvironmentVariables(): Promise<void> {
        throw new EnvironmentConfigurationCannotBeLoaded();
    }
}
