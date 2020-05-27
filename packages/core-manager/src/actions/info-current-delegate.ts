import { Application as Cli, Container as CliContainer, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { parseProcessActionResponse } from "../utils";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.currentDelegate";

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public async execute(params: object): Promise<any> {
        return await this.getCurrentDelegate();
    }

    private async getCurrentDelegate(): Promise<any> {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        const response = processManager.trigger("ark-core", "forger.currentDelegate");

        const result = parseProcessActionResponse(response);

        if (result.error) {
            throw new Error("Trigger returned error.");
        }

        return result.response;
    }
}
