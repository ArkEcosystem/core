import { Events } from "../../enums";
import { ServiceProviderCannotBeBooted } from "../../exceptions/packages";
import { ServiceProviderRepository } from "../../providers";
import { IBootstrapper } from "../interfaces";
import { IApplication } from "../../contracts/kernel";
import { injectable, inject } from "../../container";

/**
 * @export
 * @class RegisterProviders
 * @implements {IBootstrapper}
 */
@injectable()
export class BootServiceProviders implements IBootstrapper {
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
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            "serviceProviderRepository",
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            if (await serviceProvider.enableWhen()) {
                try {
                    this.app.log.debug(`Booting ${serviceProvider.name()}...`);

                    await serviceProviders.boot(name);
                } catch (error) {
                    // Determine if the plugin is required to decide how to handle errors.
                    const isRequired: boolean = await serviceProvider.required();

                    if (isRequired) {
                        throw new ServiceProviderCannotBeBooted(serviceProvider.name(), error.message);
                    }

                    serviceProviders.fail(serviceProvider.name());
                }
            } else {
                this.app.log.debug(`Deferring ${serviceProvider.name()}...`);

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

                if (serviceProviders.deferred(name) && (await serviceProvider.enableWhen())) {
                    await serviceProviders.boot(name);
                }
            });
        }
    }
}
