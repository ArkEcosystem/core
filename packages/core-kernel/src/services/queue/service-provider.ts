import { AbstractServiceProvider } from "../../support";
import { QueueManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.ioc
            .bind<QueueManager>("queueManager")
            .to(QueueManager)
            .inSingletonScope();

        // await this.app.ioc.get<QueueManager>("queueManager").boot();
    }
}
