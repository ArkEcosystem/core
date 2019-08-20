import { ProviderRepository } from "../../repositories";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterProviders
 */
export class BootServiceProviders extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const repository: ProviderRepository = this.app.resolve<ProviderRepository>("service-providers");

        for (const [name] of repository.all()) {
            await repository.boot(name);
        }
    }
}
