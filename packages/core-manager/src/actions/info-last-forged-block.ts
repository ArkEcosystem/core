import { Application as Cli, Container as CliContainer, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { getCoreOrForgerProcessName, getOnlineProcesses, parseProcessActionResponse } from "../utils";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "info.lastForgedBlock";

    public async execute(params: object): Promise<any> {
        return await this.getLastForgedBlock();
    }

    private async getLastForgedBlock(): Promise<any> {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        const processName = getCoreOrForgerProcessName(getOnlineProcesses(processManager));

        const response = processManager.trigger(processName, "forger.lastForgedBlock");

        const result = parseProcessActionResponse(response);

        if (result.error) {
            throw new Error("Trigger returned error");
        }

        return result.response;
    }
}
