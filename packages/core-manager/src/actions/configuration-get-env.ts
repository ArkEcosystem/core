import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "configuration.getEnv";

    public async execute(params: object): Promise<any> {
        return await this.getEnvFile();
    }

    public async getEnvFile(): Promise<string> {
        return (await this.filesystem.get(this.app.environmentFile())).toString();
    }
}
