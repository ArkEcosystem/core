import { existsSync } from "fs-extra";
import { extract } from "tar";

import { AbstractSource } from "./abstract-source";
import { MissingPackageFolder } from "./errors";

/**
 * @export
 * @class File
 * @implements {Source}
 */
export class File extends AbstractSource {
    public constructor(paths: { data: string; temp: string }) {
        super(paths);
    }

    /**
     * @param {string} value
     * @returns {Promise<boolean>}
     * @memberof File
     */
    public async exists(value: string): Promise<boolean> {
        return existsSync(value);
    }

    /**
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof File
     */
    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    protected async preparePackage(value: string): Promise<void> {
        await extract(
            {
                gzip: true,
                file: value,
                cwd: this.tempPath,
            },
            ["package"],
        );

        if (!existsSync(this.getOriginPath())) {
            throw new MissingPackageFolder();
        }
    }
}
