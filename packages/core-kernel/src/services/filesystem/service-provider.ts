import { AbstractServiceProvider } from "../../providers";
import { FilesystemManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.ioc
            .bind<FilesystemManager>("filesystemManager")
            .to(FilesystemManager)
            .inSingletonScope();

        const filesystemManager: FilesystemManager = this.app.ioc.get<FilesystemManager>("filesystemManager");
        await filesystemManager.boot();

        this.app.ioc.bind("filesystem").toConstantValue(filesystemManager.driver());
    }
}
