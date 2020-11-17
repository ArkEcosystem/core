import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "configuration.setEnv";

    public schema = {
        type: "object",
        properties: {},
    };

    public async execute(params: any): Promise<any> {
        await this.updateEnv(params);

        return {};
    }

    private format(params: string): string {
        let result = "";

        for (const [key, value] of Object.entries(params)) {
            result += `${key}=${value}\n`;
        }

        return result;
    }

    private async updateEnv(params: any): Promise<void> {
        await this.filesystem.put(this.app.environmentFile(), this.format(params));
    }
}
