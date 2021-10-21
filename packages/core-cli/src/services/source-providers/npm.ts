import { createWriteStream, ensureFileSync, removeSync } from "fs-extra";
import got from "got";
import stream from "stream";
import { extract } from "tar";
import { promisify } from "util";

import { AbstractSource } from "./abstract-source";

/**
 * @export
 * @class NPM
 * @implements {Source}
 */
export class NPM extends AbstractSource {
    public constructor(paths: { data: string; temp: string }) {
        super(paths);
    }

    /**
     * @param {string} value
     * @param version
     * @returns {Promise<boolean>}
     * @memberof NPM
     */
    public async exists(value: string, version?: string): Promise<boolean> {
        try {
            await this.getPackage(value, version);

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
    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    protected async preparePackage(value: string, version?: string): Promise<void> {
        const { name, tarball }: { name: string; tarball: string } = await this.getPackage(value, version);

        const tarballPath: string = `${this.tempPath}/${name}.tgz`;

        await this.downloadPackage(tarball, tarballPath);

        await this.extractPackage(name, tarballPath);
    }

    /**
     * @private
     * @param {string} value
     * @returns {Promise<{ name: string; tarball: string }>}
     * @memberof NPM
     */
    private async getPackage(value: string, version?: string): Promise<{ name: string; tarball: string }> {
        const registry = process.env.CORE_NPM_REGISTRY || "https://registry.npmjs.org";
        const { body } = await got(`${registry}/${value}`);

        const response: {
            name: string;
            versions: Record<string, { tarball: string }>[];
        } = JSON.parse(body);

        if (version && !response.versions[version]) {
            throw new Error("Invalid package version");
        }

        return {
            name: response.name,
            tarball: response.versions[version || response["dist-tags"].latest].dist.tarball,
        };
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
        await extract({
            gzip: true,
            file,
            cwd: this.tempPath,
        });

        removeSync(file);
    }
}
