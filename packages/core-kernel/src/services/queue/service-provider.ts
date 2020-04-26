import { Queue } from "../../contracts/kernel";
import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { QueueManager } from "./manager";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.bind<QueueManager>(Identifiers.QueueManager).to(QueueManager).inSingletonScope();

        this.app
            .bind(Identifiers.QueueFactory)
            .toFactory((context: interfaces.Context) => async <K, T>(name?: string): Promise<Queue> =>
                context.container.get<QueueManager>(Identifiers.QueueManager).driver<Queue>(name),
            );
    }
}
