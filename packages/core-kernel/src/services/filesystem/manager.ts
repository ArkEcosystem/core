import { Filesystem } from "../../contracts/kernel/filesystem";
import { Manager } from "../../support/manager";
import { LocalFilesystem } from "./drivers/local";

/**
 * @export
 * @class FilesystemManager
 * @extends {Manager<Filesystem>}
 */
export class FilesystemManager extends Manager<Filesystem> {
    /**
     * Create an instance of the Local driver.
     *
     * @protected
     * @returns {Promise<Filesystem>}
     * @memberof FilesystemManager
     */
    protected async createLocalDriver(): Promise<Filesystem> {
        return this.app.resolve(LocalFilesystem).make();
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
