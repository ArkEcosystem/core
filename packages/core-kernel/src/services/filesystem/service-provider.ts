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
        this.app
            .bind<FilesystemManager>("filesystemManager")
            .to(FilesystemManager)
            .inSingletonScope();

        const filesystemManager: FilesystemManager = this.app.get<FilesystemManager>("filesystemManager");
        await filesystemManager.boot();

        this.app.bind("filesystem").toConstantValue(filesystemManager.driver());
    }
}
