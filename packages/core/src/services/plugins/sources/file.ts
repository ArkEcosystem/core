import { Paths } from "env-paths";
import { existsSync } from "fs";
import { ensureDirSync, moveSync, removeSync } from "fs-extra";
import { parse } from "path";
import { extract } from "tar";

import { Source } from "./contracts";

export class File implements Source {
    private readonly dataPath: string;

    public constructor(private readonly paths: Paths) {
        this.dataPath = `${this.paths.data}/plugins`;

        ensureDirSync(this.dataPath);
    }

    public async exists(value: string): Promise<boolean> {
        return existsSync(value);
    }

    public async install(value: string): Promise<void> {
        await this.extractPackage(value);

        removeSync(value);
    }

    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    private async extractPackage(file: string): Promise<void> {
        removeSync(this.getTargetPath(file));

        await extract({
            gzip: true,
            file,
            cwd: this.dataPath,
        });

        moveSync(`${this.dataPath}/package`, this.getTargetPath(file));
    }

    private getTargetPath(value: string): string {
        return `${this.dataPath}/${parse(value).name.replace(":", "/")}`;
    }
}
