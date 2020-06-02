import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "configuration.getPlugins";

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public async execute(params: object): Promise<any> {
        return await this.getPluginFile();
    }

    public async getPluginFile(): Promise<string> {
        return (await this.filesystem.get(this.app.configPath("plugins.js"))).toString();
    }
}
