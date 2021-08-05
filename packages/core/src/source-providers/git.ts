import { Utils } from "@arkecosystem/core-kernel";
import execa from "execa";
import { removeSync } from "fs-extra";

import { AbstractSource } from "./abstract-source";

/**
 * @export
 * @class Git
 * @implements {Source}
 */
export class Git extends AbstractSource {
    /**
     * @param {{ data: string; temp?: string }} { data }
     * @memberof Git
     */
    public constructor({ data }: { data: string; temp?: string }) {
        super({ data });
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
    public async install(value: string): Promise<void> {
        const dest: string = this.getTargetPath(value);

        removeSync(dest);

        execa.sync(`git`, ["clone", value, dest])

        await this.installDependencies(dest);
    }

    /**
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof Git
     */
    public async update(value: string): Promise<void> {
        execa.sync(`cd ${this.getTargetPath(value)} && git reset --hard && git pull`);
    }

    /**
     * @private
     * @param {string} value
     * @returns {string}
     * @memberof Git
     */
    private getName(value: string): string {
        const url:
            | {
                  repo: string;
              }
            | undefined = Utils.parseGitUrl(value);

        Utils.assert.defined<{ repo: string }>(url);

        return url.repo;
    }

    /**
     * @private
     * @param {string} value
     * @returns {string}
     * @memberof Git
     */
    private getTargetPath(value: string): string {
        return `${this.dataPath}/${this.getName(value)}`;
    }
}
