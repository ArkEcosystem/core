import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { QueueManager } from "./manager";
import { Identifiers, interfaces } from "../../container";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<QueueManager>(Identifiers.QueueManager)
            .to(QueueManager)
            .inSingletonScope();

        await this.app.get<QueueManager>(Identifiers.QueueManager).boot();

        this.app
            .bind(Identifiers.QueueService)
            .toDynamicValue((context: interfaces.Context) =>
                context.container.get<QueueManager>(Identifiers.QueueManager).driver(),
            );
    }
}
