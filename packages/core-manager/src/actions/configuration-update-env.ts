import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "configuration.updateEnv";

    public schema = {
        type: "object",
        properties: {
            content: {
                type: "string",
            },
        },
        required: ["content"],
    };

    public async execute(params: { content: string }): Promise<any> {
        await this.updateEnv(params.content);

        return {};
    }

    private validateEnv(content: string): void {
        let count = 0;
        for (const line of content.toString().split("\n")) {
            count++;
            if (line === "") {
                continue;
            }
            const matches: RegExpExecArray | null = new RegExp(/^[A-Z][A-Z0-9_]*=\S\S*$/).exec(line);

            if (!matches) {
                throw new Error(`Invalid line [${count}]: ${line}`);
            }
        }
    }

    private async updateEnv(content: string): Promise<void> {
        this.validateEnv(content);

        await this.filesystem.put(this.app.environmentFile(), content);
    }
}
