import { AbstractServiceProvider } from "../../support";
import { FilesystemManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.singleton("filesystemManager", FilesystemManager);

        const filesystemManager: FilesystemManager = this.app.resolve<FilesystemManager>("filesystemManager");
        await filesystemManager.boot();

        this.app.bind("filesystem", filesystemManager.driver());
    }
}
