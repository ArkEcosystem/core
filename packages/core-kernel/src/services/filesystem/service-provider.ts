import { Identifiers, interfaces } from "../../ioc";
import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { FilesystemManager } from "./manager";

export class ServiceProvider extends BaseServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<FilesystemManager>(Identifiers.FilesystemManager)
            .to(FilesystemManager)
            .inSingletonScope();

        await this.app.get<FilesystemManager>(Identifiers.FilesystemManager).boot();

        this.app
            .bind(Identifiers.FilesystemService)
            .toDynamicValue((context: interfaces.Context) =>
                context.container.get<FilesystemManager>(Identifiers.FilesystemManager).driver(),
            );
    }
}
