import { Utils } from "@arkecosystem/core-kernel";
import execa from "execa";
import { join } from "path";

import { AbstractSource } from "./abstract-source";

/**
 * @export
 * @class Git
 * @implements {Source}
 */
export class Git extends AbstractSource {
    public constructor(paths: { data: string; temp: string }) {
        super(paths);
    }

    /**
     * @param {string} value
     * @returns {Promise<boolean>}
     * @memberof Git
     */
    /**
     * @param {string} value
     * @returns {Promise<boolean>}
     * @memberof Git
     */
    public async exists(value: string): Promise<boolean> {
        return Utils.isGit(value);
    }

    /**
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof Git
     */
    public async update(value: string): Promise<void> {
        const dest = join(this.dataPath, value);

        execa.sync(`git`, ["reset", "--hard"], { cwd: dest });
        execa.sync(`git`, ["pull"], { cwd: dest });

        await this.installDependencies(dest);
    }

    protected async preparePackage(value: string): Promise<void> {
        const downloadPath: string = join(this.tempPath, "package");

        execa.sync(`git`, ["clone", value, downloadPath]);
    }
}
