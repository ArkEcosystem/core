import { Kernel } from "../../contracts";

/**
 * @export
 * @class FilesystemFactory
 */
export class FilesystemFactory {
    /**
     * @param {Kernel.IApplication} app
     * @memberof FilesystemFactory
     */
    public constructor(private readonly app: Kernel.IApplication) {}

    /**
     * @param {Kernel.IFilesystem} driver
     * @returns {Promise<Kernel.IFilesystem>}
     * @memberof FilesystemFactory
     */
    public async make(driver: Kernel.IFilesystem): Promise<Kernel.IFilesystem> {
        return driver.make(this.app);
    }
}
