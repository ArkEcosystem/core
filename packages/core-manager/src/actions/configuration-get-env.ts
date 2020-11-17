import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "configuration.getEnv";

    public async execute(params: any): Promise<any> {
        return this.parseEnvContent(await this.getEnvFile());
    }

    private async getEnvFile(): Promise<string> {
        return (await this.filesystem.get(this.app.environmentFile())).toString();
    }

    private parseEnvContent(content: string) {
        const result = {};

        for (const line of content.split("\n")) {
            const splitLine = line.split("=");

            if (splitLine.length === 2) {
                result[splitLine[0]] = splitLine[1].match(/^[0-9]+$/) ? parseInt(splitLine[1]) : splitLine[1];
            }
        }

        return result;
    }
}
