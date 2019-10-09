import { Utils } from "@arkecosystem/core-kernel";
import { Paths } from "env-paths";
import { ensureDirSync, removeSync } from "fs-extra";
import git from "simple-git/promise";

import { Source } from "./contracts";

export class Git implements Source {
    private readonly dataPath: string;

    public constructor(private readonly paths: Paths) {
        this.dataPath = `${this.paths.data}/plugins`;

        ensureDirSync(this.dataPath);
    }

    public async exists(value: string): Promise<boolean> {
        return Utils.isGit(value);
    }

    public async install(value: string): Promise<void> {
        const dest: string = this.getTargetPath(value);

        removeSync(dest);

        await git().clone(value, dest);
    }

    public async update(value: string): Promise<void> {
        await git(this.getTargetPath(value)).pull();
    }

    private getName(value: string): string {
        return Utils.parseGitUrl(value).repo;
    }

    private getTargetPath(value: string): string {
        return `${this.dataPath}/${this.getName(value)}`;
    }
}
