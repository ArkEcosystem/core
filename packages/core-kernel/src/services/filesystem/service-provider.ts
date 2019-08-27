import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { FilesystemManager } from "./manager";
import { Identifiers } from "../../container";

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

        const filesystemManager: FilesystemManager = this.app.get<FilesystemManager>(Identifiers.FilesystemManager);
        await filesystemManager.boot();

        this.app.bind("filesystem").toConstantValue(filesystemManager.driver());
    }
}
