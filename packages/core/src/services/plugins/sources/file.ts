import { existsSync } from "fs";
import { ensureDirSync, removeSync } from "fs-extra";
import { parse } from "path";
import { extract } from "tar";

import { Source } from "./contracts";

export class File implements Source {
    private readonly dataPath: string;

    public constructor({ data }: { data: string; temp?: string }) {
        this.dataPath = `${data}/plugins`;

        ensureDirSync(this.dataPath);
    }

    public async exists(value: string): Promise<boolean> {
        return existsSync(value);
    }

    public async install(value: string): Promise<void> {
        removeSync(this.getTargetPath(value));

        await extract({
            gzip: true,
            file: value,
            cwd: this.dataPath,
        });

        removeSync(value);
    }

    public async update(value: string): Promise<void> {
        await this.install(value);
    }

    private getTargetPath(value: string): string {
        return `${this.dataPath}/${parse(value).name.replace(":", "/")}`;
    }
}
