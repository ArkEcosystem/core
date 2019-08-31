import { Identifiers, interfaces } from "../../container";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { LogManager } from "./manager";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<LogManager>(Identifiers.LogManager)
            .to(LogManager)
            .inSingletonScope();

        await this.app.get<LogManager>(Identifiers.LogManager).boot();

        this.app
            .bind(Identifiers.LogService)
            .toDynamicValue((context: interfaces.Context) =>
                context.container.get<LogManager>(Identifiers.LogManager).driver(),
            );
    }
}
