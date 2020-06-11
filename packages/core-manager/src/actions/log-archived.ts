import { Container, Contracts } from "@arkecosystem/core-kernel";
import { basename } from "path";

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
        const logsPath = `${process.env.HOME}/.pm2/logs`;
        return this.filesystem.files(logsPath);
    }
}
