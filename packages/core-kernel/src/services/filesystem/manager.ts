import { Kernel } from "../../contracts";
import { AbstractManager } from "../../support/manager";
import { Local } from "./drivers/local";

export class FilesystemManager extends AbstractManager<Kernel.IFilesystem> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<Kernel.IFilesystem>}
     * @memberof FilesystemManager
     */
    public async createLocalDriver(): Promise<Kernel.IFilesystem> {
        return this.app.build(Local).make();
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof FilesystemManager
     */
    protected getDefaultDriver(): string {
        return "local";
    }
}
