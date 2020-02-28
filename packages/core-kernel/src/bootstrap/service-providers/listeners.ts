import { EventListener } from "../../contracts/kernel";
import { BlockEvent, KernelEvent } from "../../enums";
import { Identifiers, inject, injectable } from "../../ioc";
import { ServiceProvider, ServiceProviderRepository } from "../../providers";

/**
 * @class Disconnect
 * @implements {EventListener}
 */
@injectable()
export class ChangeServiceProviderState implements EventListener {
    /**
     * @private
     * @type {ServiceProviderRepository}
     * @memberof BootServiceProviders
     */
    @inject(Identifiers.ServiceProviderRepository)
    private readonly serviceProviders!: ServiceProviderRepository;

    /**
     * @private
     * @type {string}
     * @memberof ChangeServiceProviderState
     */
    private name!: string;

    /**
     * @private
     * @type {ServiceProvider}
     * @memberof ChangeServiceProviderState
     */
    private serviceProvider!: ServiceProvider;

    /**
     * @param {string} name
     * @param {ServiceProvider} serviceProvider
     * @returns {this}
     * @memberof ChangeServiceProviderState
     */
    public initialize(name: string, serviceProvider: ServiceProvider): this {
        this.name = name;
        this.serviceProvider = serviceProvider;

        return this;
    }

    /**
     * @param {*} {name,data}
     * @returns {Promise<void>}
     * @memberof ChangeServiceProviderState
     */
    public async handle({ name, data }): Promise<void> {
        if (name === BlockEvent.Applied) {
            return this.changeState();
        }

        if (name === KernelEvent.ServiceProviderBooted && data.name !== this.name) {
            return this.changeState(data.name);
        }
    }

    /**
     * @private
     * @param {string} [previous]
     * @returns {Promise<void>}
     * @memberof BootServiceProviders
     */
    private async changeState(previous?: string): Promise<void> {
        if (this.serviceProviders.failed(this.name)) {
            return;
        }

        if (this.serviceProviders.loaded(this.name) && (await this.serviceProvider.disposeWhen(previous))) {
            await this.serviceProviders.dispose(this.name);
        }

        if (this.serviceProviders.deferred(this.name) && (await this.serviceProvider.bootWhen(previous))) {
            await this.serviceProviders.boot(this.name);
        }
    }
}
