import { Application as Cli, Container as CliContainer, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "process.restart";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
        },
    };

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public async execute(params: any): Promise<any> {
        return {
            name: params.name,
            status: this.restartProcess(params.name),
        };
    }

    private restartProcess(name: string): string {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        processManager.restart(name);

        return processManager.status(name) || "undefined";
    }
}
