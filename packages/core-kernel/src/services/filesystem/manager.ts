import { Filesystem } from "../../contracts/kernel/filesystem";
import { AbstractManager } from "../../support/manager";
import { Local } from "./drivers/local";

/**
 * @export
 * @class FilesystemManager
 * @extends {AbstractManager<Filesystem>}
 */
export class FilesystemManager extends AbstractManager<Filesystem> {
    /**
     * Create an instance of the Local driver.
     *
     * @returns {Promise<Filesystem>}
     * @memberof FilesystemManager
     */
    public async createLocalDriver(): Promise<Filesystem> {
        return this.app.resolve(Local).make();
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
