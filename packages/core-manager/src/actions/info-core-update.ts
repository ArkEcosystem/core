import { Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { CliManager } from "../utils/cli-manager";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Identifiers.CliManager)
    private readonly cliManager!: CliManager;

    public name = "info.coreUpdate";

    public async execute(params: object): Promise<any> {
        await this.cliManager.runCommand("update");
        return {};
    }
}
