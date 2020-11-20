import { Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { CliManager } from "../utils/cli-manager";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Identifiers.CliManager)
    private readonly cliManager!: CliManager;

    public name = "process.start";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
            args: {
                type: "string",
            },
        },
        required: ["name", "args"],
    };

    public async execute(params: { name: string; args: string }): Promise<any> {
        await this.cliManager.runCommand(`${params.name}:start`, params.args);
        return {};
    }
}
