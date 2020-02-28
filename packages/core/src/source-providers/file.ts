import { existsSync } from "fs";
import { ensureDirSync, removeSync } from "fs-extra";
import { parse } from "path";
import { extract } from "tar";

import { Source } from "./contracts";

/**
 * @export
 * @class File
 * @implements {Source}
 */
export class File implements Source {
    /**
     * @private
     * @type {string}
     * @memberof File
     */
    private readonly dataPath: string;

    /**
     * @param {{ data: string; temp?: string }} { data }
     * @memberof File
     */
    public constructor({ data }: { data: string; temp?: string }) {
        this.dataPath = `${data}/plugins`;

        ensureDirSync(this.dataPath);
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
    public async install(value: string): Promise<void> {
        removeSync(this.getTargetPath(value));

        await extract({
            gzip: true,
            file: value,
            cwd: this.dataPath,
        });

        removeSync(value);
    }

    /**
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof File
     */
    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    /**
     * @private
     * @param {string} value
     * @returns {string}
     * @memberof File
     */
    private getTargetPath(value: string): string {
        return `${this.dataPath}/${parse(value).name.replace(":", "/")}`;
    }
}
