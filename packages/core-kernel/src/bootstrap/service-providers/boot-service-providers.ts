import { Identifiers, inject, injectable } from "../../container";
import { Application } from "../../contracts/kernel";
import { Events } from "../../enums";
import { ServiceProviderCannotBeBooted } from "../../exceptions/packages";
import { ServiceProviderRepository } from "../../providers";
import { Bootstrapper } from "../interfaces";

/**
 * @export
 * @class RegisterProviders
 * @implements {Bootstrapper}
 */
@injectable()
export class BootServiceProviders implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            if (await serviceProvider.enableWhen()) {
                try {
                    await serviceProviders.boot(name);
                } catch (error) {
                    const isRequired: boolean = await serviceProvider.required();

                    if (isRequired) {
                        throw new ServiceProviderCannotBeBooted(serviceProvider.name(), error.message);
                    }

                    serviceProviders.fail(serviceProvider.name());
                }
            } else {
                serviceProviders.defer(name);
            }

            // Register the "enable/disableWhen" listeners to be triggered on every block. Use with care!
            this.app.events.listen(Events.State.BlockApplied, async () => {
                if (serviceProviders.failed(name)) {
                    return;
                }

                if (serviceProviders.loaded(name) && (await serviceProvider.disableWhen())) {
                    await serviceProviders.dispose(name);
                }

                /* istanbul ignore else */
                if (serviceProviders.deferred(name) && (await serviceProvider.enableWhen())) {
                    await serviceProviders.boot(name);
                }
            });
        }
    }
}
