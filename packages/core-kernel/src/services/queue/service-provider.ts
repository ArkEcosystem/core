import { Queue } from "../../contracts/kernel";
import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { MemoryQueue } from "./drivers/memory";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind(Identifiers.QueueFactory)
            .toFactory((context: interfaces.Context) => (): Queue => context.container.resolve<Queue>(MemoryQueue));
    }
}
