import { createWriteStream, ensureDirSync, ensureFileSync, moveSync, removeSync } from "fs-extra";
import got from "got";
import stream from "stream";
import { extract } from "tar";
import { promisify } from "util";

import { Source } from "./contracts";

/**
 * @export
 * @class NPM
 * @implements {Source}
 */
export class NPM implements Source {
    /**
     * @private
     * @type {string}
     * @memberof NPM
     */
    private readonly dataPath: string;

    /**
     * @private
     * @type {(string | undefined)}
     * @memberof NPM
     */
    private readonly tempPath: string | undefined;

    /**
     * @param {{ data: string; temp?: string }} { data, temp }
     * @memberof NPM
     */
    public constructor({ data, temp }: { data: string; temp?: string }) {
        this.dataPath = `${data}/plugins`;
        this.tempPath = temp;

        ensureDirSync(this.dataPath);
    }

    /**
     * @param {string} value
     * @returns {Promise<boolean>}
     * @memberof NPM
     */
    public async exists(value: string): Promise<boolean> {
        try {
            await this.getPackage(value);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof NPM
     */
    public async install(value: string): Promise<void> {
        const { name, tarball }: { name: string; tarball: string } = await this.getPackage(value);

        const tarballPath: string = `${this.tempPath}/plugins/${name}.tgz`;

        await this.downloadPackage(tarball, tarballPath);

        await this.extractPackage(name, tarballPath);

        removeSync(tarballPath);
    }

    /**
     * @param {string} value
     * @returns {Promise<void>}
     * @memberof NPM
     */
    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    /**
     * @private
     * @param {string} value
     * @returns {Promise<{ name: string; tarball: string }>}
     * @memberof NPM
     */
    private async getPackage(value: string): Promise<{ name: string; tarball: string }> {
        const { body } = await got(`https://registry.npmjs.org/${value}`);

        const response: {
            name: string;
            versions: Record<string, { tarball: string }>[];
        } = JSON.parse(body);

        return { name: response.name, tarball: response.versions[response["dist-tags"].latest].dist.tarball };
    }

    /**
     * @private
     * @param {string} source
     * @param {string} dest
     * @returns {Promise<void>}
     * @memberof NPM
     */
    private async downloadPackage(source: string, dest: string): Promise<void> {
        removeSync(dest);

        ensureFileSync(dest);

        await promisify(stream.pipeline)(got.stream(source), createWriteStream(dest));
    }

    /**
     * @private
     * @param {string} name
     * @param {string} file
     * @returns {Promise<void>}
     * @memberof NPM
     */
    private async extractPackage(name: string, file: string): Promise<void> {
        removeSync(this.getTargetPath(name));

        await extract({
            gzip: true,
            file,
            cwd: this.dataPath,
        });

        moveSync(`${this.dataPath}/package`, this.getTargetPath(name));

        removeSync(file);
    }

    /**
     * @private
     * @param {string} value
     * @returns {string}
     * @memberof NPM
     */
    private getTargetPath(value: string): string {
        return `${this.dataPath}/${value}`;
    }
}
