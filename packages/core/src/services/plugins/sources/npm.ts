import { Paths } from "env-paths";
import { createWriteStream } from "fs";
import { moveSync, removeSync } from "fs-extra";
import got from "got";
import stream from "stream";
import { extract } from "tar";
import { promisify } from "util";

import { Source } from "./contracts";

export class NPM implements Source {
    private readonly dataPath: string;

    public constructor(private readonly paths: Paths) {
        this.dataPath = `${this.paths.data}/plugins`;
    }

    public async exists(value: string): Promise<boolean> {
        try {
            await this.getPackage(value);

            return true;
        } catch {
            return false;
        }
    }

    public async install(value: string): Promise<void> {
        const { name, tarball }: { name: string; tarball: string } = await this.getPackage(value);

        const tarballPath: string = `${this.paths.temp}/plugins/${name}.tgz`;

        await this.downloadPackage(tarball, tarballPath);

        await this.extractPackage(name, tarballPath);

        removeSync(tarballPath);
    }

    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    private async getPackage(value: string): Promise<{ name: string; tarball: string }> {
        const { body } = await got(`https://registry.npmjs.org/${value}`);

        const response: {
            name: string;
            versions: Record<string, { tarball: string }>[];
        } = JSON.parse(body);

        return { name: response.name, tarball: response.versions[response["dist-tags"].latest].dist.tarball };
    }

    private async downloadPackage(source: string, dest: string): Promise<void> {
        removeSync(dest);

        await promisify(stream.pipeline)(got.stream(source), createWriteStream(dest));
    }

    private async extractPackage(name: string, file: string): Promise<void> {
        removeSync(this.getTargetPath(name));

        await extract({
            gzip: true,
            file,
            cwd: this.dataPath,
        });

        moveSync(`${this.dataPath}/package`, this.getTargetPath(name));
    }

    private getTargetPath(value: string): string {
        return `${this.dataPath}/${value}`;
    }
}
