import { Application as Cli, Container as CliContainer, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "process.list";

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public async execute(params: any): Promise<any> {
        return this.getProcessList();
    }

    private getProcessList(): any[] {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        const processList = processManager.list();

        for (const processInfo of processList) {
            delete processInfo.pm2_env;

            processInfo.status = processManager.status(processInfo.name) || "undefined";
        }

        return processList;
    }
}
