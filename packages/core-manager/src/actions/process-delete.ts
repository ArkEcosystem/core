import { Application as Cli, Container as CliContainer, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "process.delete";

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
        this.deleteProcess(params.name);

        return {};
    }

    private deleteProcess(name: string): void {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        processManager.delete(name);
    }
}
