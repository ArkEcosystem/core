import { Container, Contracts } from "@arkecosystem/core-kernel";
import { pathExistsSync } from "fs-extra";
import { basename, join, extname } from "path";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "log.archived";

    public async execute(params: object): Promise<any> {
        return Promise.all((await this.getArchivedLogs()).map((x) => this.getArchiveInfo(x)));
    }

    private async getArchiveInfo(path: string): Promise<any> {
        return {
            name: basename(path),
            size: Math.round((await this.filesystem.size(path)) / 1024),
            downloadLink: `/log/archived/${basename(path)}`,
        };
    }

    private async getArchivedLogs(): Promise<string[]> {
        const logsPath = join(process.env.CORE_PATH_DATA!, "log-archive");

        if (!pathExistsSync(logsPath)) {
            return [];
        }

        const files = await this.filesystem.files(logsPath);

        return files.filter((fileName) => extname(fileName) === ".gz");
    }
}
