import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { pathExistsSync } from "fs-extra";
import { basename, extname, join } from "path";
import getPublicIp from "public-ip";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    public name = "log.archived";

    public async execute(params: object): Promise<any> {
        const serverUrl = await this.getServerUrl();

        return Promise.all((await this.getArchivedLogs()).map((logPath) => this.getArchiveInfo(serverUrl, logPath)));
    }

    private async getArchiveInfo(serverUrl: string, logPath: string): Promise<any> {
        return {
            name: basename(logPath),
            size: Math.round((await this.filesystem.size(logPath)) / 1024),
            downloadLink: `${serverUrl}/log/archived/${basename(logPath)}`,
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

    private async getServerUrl(): Promise<string> {
        let publicIp = this.configuration.getOptional<string | undefined>("server.ip", undefined);

        if (!publicIp) {
            publicIp = await getPublicIp.v4();
        }

        if (this.app.isBound(Identifiers.HTTPS_JSON_RPC)) {
            return `https://${publicIp}:${this.configuration.getRequired<number>("server.https.port")}`;
        }

        return `http://${publicIp}:${this.configuration.getRequired<number>("server.http.port")}`;
    }
}
