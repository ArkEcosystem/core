import { State } from "../../enums/event";
import { FailedServiceProviderBoot } from "../../errors";
import { ServiceProviderRepository } from "../../repositories";
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
        const serviceProviders: ServiceProviderRepository = this.app.resolve<ServiceProviderRepository>(
            "serviceProviderRepository",
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            if (await serviceProvider.enableWhen()) {
                try {
                    await serviceProviders.boot(name);
                } catch (error) {
                    // Determine if the plugin is required to decide how to handle errors.
                    const isRequired: boolean = await serviceProvider.required();

                    if (isRequired) {
                        throw new FailedServiceProviderBoot(serviceProvider.name(), error.message);
                    }

                    serviceProviders.fail(serviceProvider.name());
                }
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
