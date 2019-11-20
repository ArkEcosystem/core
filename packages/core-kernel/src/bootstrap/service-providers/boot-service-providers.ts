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
     * @private
     * @type {ServiceProviderRepository}
     * @memberof BootServiceProviders
     */
    @inject(Identifiers.ServiceProviderRepository)
    private readonly serviceProviders!: ServiceProviderRepository;

    /**
     * @returns {Promise<void>}
     * @memberof RegisterProviders
     */
    public async bootstrap(): Promise<void> {
        for (const [name, serviceProvider] of this.serviceProviders.all()) {
            const serviceProviderName: string | undefined = serviceProvider.name();

            assert.defined<string>(serviceProviderName);

            if (await serviceProvider.bootWhen()) {
                try {
                    await this.serviceProviders.boot(name);
                } catch (error) {
                    this.app.log.error(error.stack);
                    const isRequired: boolean = await serviceProvider.required();

                    if (isRequired) {
                        throw new ServiceProviderCannotBeBooted(serviceProviderName, error.message);
                    }

                    this.serviceProviders.fail(serviceProviderName);
                }
            } else {
                this.serviceProviders.defer(name);
            }

            // Register the "enable/disposeWhen" listeners to be triggered on every block. Use with care!
            this.app.events.listen(StateEvent.BlockApplied, async () => await this.changeState(name, serviceProvider));

            // We only want to trigger this if another service provider has been booted to avoid an infinite loop.
            this.app.events.listen(InternalEvent.ServiceProviderBooted, async ({ data }) => {
                if (data.name !== name) {
                    await this.changeState(name, serviceProvider, data.name);
                }
            });
        }
    }

    /**
     * @private
     * @param {string} name
     * @param {ServiceProvider} serviceProvider
     * @param {string} [previous]
     * @returns {Promise<void>}
     * @memberof BootServiceProviders
     */
    private async changeState(name: string, serviceProvider: ServiceProvider, previous?: string): Promise<void> {
        if (this.serviceProviders.failed(name)) {
            return;
        }

        if (this.serviceProviders.loaded(name) && (await serviceProvider.disposeWhen(previous))) {
            await this.serviceProviders.dispose(name);
        }

        /* istanbul ignore else */
        if (this.serviceProviders.deferred(name) && (await serviceProvider.bootWhen(previous))) {
            await this.serviceProviders.boot(name);
        }
    }
}
