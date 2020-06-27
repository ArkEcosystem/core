import { Contracts } from "../..";
import { Application } from "../../contracts/kernel";
// @ts-ignore
import { BlockEvent, KernelEvent, StateEvent } from "../../enums";
import { ServiceProviderCannotBeBooted } from "../../exceptions/plugins";
import { Identifiers, inject, injectable } from "../../ioc";
// @ts-ignore
import { ServiceProvider, ServiceProviderRepository } from "../../providers";
import { assert } from "../../utils";
import { Bootstrapper } from "../interfaces";
import { ChangeServiceProviderState } from "./listeners";

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
     * @private
     * @type {Contracts.Kernel.EventDispatcher}
     * @memberof BootServiceProviders
     */
    @inject(Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof BootServiceProviders
     */
    @inject(Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

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
                    this.logger.error(error.stack);
                    const isRequired: boolean = await serviceProvider.required();

                    if (isRequired) {
                        throw new ServiceProviderCannotBeBooted(serviceProviderName, error.message);
                    }

                    this.serviceProviders.fail(serviceProviderName);
                }
            } else {
                this.serviceProviders.defer(name);
            }

            const eventListener: Contracts.Kernel.EventListener = this.app
                .resolve(ChangeServiceProviderState)
                .initialize(serviceProviderName, serviceProvider);

            // Register the "enable/disposeWhen" listeners to be triggered on every block. Use with care!
            this.events.listen(BlockEvent.Applied, eventListener);

            // We only want to trigger this if another service provider has been booted to avoid an infinite loop.
            this.events.listen(KernelEvent.ServiceProviderBooted, eventListener);
        }
    }
}
