import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { ProcessActionsManager } from "./manager";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<ProcessActionsManager>(Identifiers.ProcessActionsManager)
            .to(ProcessActionsManager)
            .inSingletonScope();

        await this.app.get<ProcessActionsManager>(Identifiers.ProcessActionsManager).boot();

        this.app
            .bind(Identifiers.ProcessActionsService)
            .toDynamicValue((context: interfaces.Context) =>
                context.container.get<ProcessActionsManager>(Identifiers.ProcessActionsManager).driver(),
            );
    }
}
