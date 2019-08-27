import { AbstractServiceProvider } from "../../providers";
import { QueueManager } from "./manager";
import { Identifiers } from "../../container";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<QueueManager>(Identifiers.QueueManager)
            .to(QueueManager)
            .inSingletonScope();

        // await this.app.get<QueueManager>(Identifiers.QueueManager).boot();
    }
}
