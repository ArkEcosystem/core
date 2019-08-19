import { Kernel } from "../../contracts";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadEnvironmentVariables
 */
export class LoadEnvironmentVariables extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadEnvironmentVariables
     */
    public async bootstrap(): Promise<void> {
        await this.app.resolve<Kernel.IConfigAdapter>("configLoader").loadEnvironmentVariables();
    }
}
