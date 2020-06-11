import { Application as Cli, Container as CliContainer, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "process.stop";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
        },
        required: ["name"],
    };

    public async execute(params: any): Promise<any> {
        return {
            name: params.name,
            status: this.stopProcess(params.name),
        };
    }

    private stopProcess(name: string): string {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        processManager.stop(name);

        return processManager.status(name)?.toString() || "undefined";
    }
}
