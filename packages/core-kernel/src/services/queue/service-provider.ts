import { AbstractServiceProvider } from "../../providers";
import { QueueManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<QueueManager>("queueManager")
            .to(QueueManager)
            .inSingletonScope();

        // await this.app.get<QueueManager>("queueManager").boot();
    }
}
