import { IFilesystem } from "../../contracts/kernel/filesystem";
import { AbstractManager } from "../../support/manager";
import { Local } from "./drivers/local";

/**
 * @export
 * @class FilesystemManager
 * @extends {AbstractManager<IFilesystem>}
 */
export class FilesystemManager extends AbstractManager<IFilesystem> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<IFilesystem>}
     * @memberof FilesystemManager
     */
    public async createLocalDriver(): Promise<IFilesystem> {
        return this.app.ioc.resolve(Local).make();
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
