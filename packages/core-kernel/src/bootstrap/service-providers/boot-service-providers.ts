import { State } from "../../enums/event";
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
        const serviceProviders: ProviderRepository = this.app.resolve<ProviderRepository>("service-providers");

        for (const [name, serviceProvider] of serviceProviders.all()) {
            if (await serviceProvider.enableWhen()) {
                await serviceProviders.boot(name);
            } else {
                serviceProviders.defer(name);
            }

            this.app.events.listen(State.BlockApplied, async () => {
                if (serviceProviders.failed(name)) {
                    return;
                }

                if (serviceProviders.loaded(name) && (await serviceProvider.disableWhen())) {
                    await serviceProviders.dispose(name);
                }

                if (serviceProviders.deferred(name) && (await serviceProvider.enableWhen())) {
                    await serviceProviders.boot(name);
                }
            });
        }
    }
}
