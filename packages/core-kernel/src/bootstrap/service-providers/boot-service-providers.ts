import { Application } from "../../contracts/kernel";
// @ts-ignore
import { InternalEvent, StateEvent } from "../../enums";
import { ServiceProviderCannotBeBooted } from "../../exceptions/plugins";
import { Identifiers, inject, injectable } from "../../ioc";
// @ts-ignore
import { ServiceProvider, ServiceProviderRepository } from "../../providers";
import { assert } from "../../utils";
import { Bootstrapper } from "../interfaces";

// todo: review the implementation
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
    private readonly app!: Application;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        const serviceProviders: ServiceProviderRepository = this.app.get<ServiceProviderRepository>(
            Identifiers.ServiceProviderRepository,
        );

        for (const [name, serviceProvider] of serviceProviders.all()) {
            const serviceProviderName: string | undefined = serviceProvider.name();

            assert.defined<string>(serviceProviderName);

            if (await serviceProvider.enableWhen()) {
                try {
                    await serviceProviders.boot(name);
                } catch (error) {
                    const isRequired: boolean = await serviceProvider.required();

                    if (isRequired) {
                        throw new ServiceProviderCannotBeBooted(serviceProviderName, error.message);
                    }

                    serviceProviders.fail(serviceProviderName);
                }
            } else {
                serviceProviders.defer(name);
            }

            // Register the "enable/disableWhen" listeners to be triggered on every block. Use with care!
            this.app.events.listen(
                StateEvent.BlockApplied,
                async () => await this.changeState(name, serviceProvider, serviceProviders),
            );

            // We only want to trigger this if another service provider has been booted to avoid an infinite loop.
            this.app.events.listen(InternalEvent.ServiceProviderBooted, async ({ data }) => {
                if (data.name !== name) {
                    await this.changeState(name, serviceProvider, serviceProviders);
                }
            });
        }
    }

    private async changeState(
        name: string,
        serviceProvider: ServiceProvider,
        serviceProviders: ServiceProviderRepository,
    ): Promise<void> {
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
    }
}
