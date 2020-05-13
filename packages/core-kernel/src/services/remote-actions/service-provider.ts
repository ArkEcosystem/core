import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { RemoteActionManager } from "./manager";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.bind<RemoteActionManager>(Identifiers.RemoteActionManager).to(RemoteActionManager).inSingletonScope();

        await this.app.get<RemoteActionManager>(Identifiers.RemoteActionManager).boot();

        this.app
            .bind(Identifiers.RemoteActionsService)
            .toDynamicValue((context: interfaces.Context) =>
                context.container.get<RemoteActionManager>(Identifiers.ValidationManager).driver(),
            );
    }
}
