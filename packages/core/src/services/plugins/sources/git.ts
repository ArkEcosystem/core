import { Utils } from "@arkecosystem/core-kernel";
import execa from "execa";
import { ensureDirSync, removeSync } from "fs-extra";

import { Source } from "./contracts";

export class Git implements Source {
    private readonly dataPath: string;

    public constructor({ data }: { data: string; temp?: string }) {
        this.dataPath = `${data}/plugins`;

        ensureDirSync(this.dataPath);
    }

    public async exists(value: string): Promise<boolean> {
        return Utils.isGit(value);
    }

    public async install(value: string): Promise<void> {
        const dest: string = this.getTargetPath(value);

        removeSync(dest);

        execa.sync(`git clone ${value} ${dest}`);
    }

    public async update(value: string): Promise<void> {
        execa.sync(`cd ${this.getTargetPath(value)} && git reset --hard && git pull`);
    }

    private getName(value: string): string {
        return Utils.parseGitUrl(value).repo;
    }

    private getTargetPath(value: string): string {
        return `${this.dataPath}/${this.getName(value)}`;
    }
}
