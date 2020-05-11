import { Application, Container } from "@arkecosystem/core-kernel";
import { Application as Cli, Container as CliContainer, Contracts, Services } from "@arkecosystem/core-cli";
import { Actions } from "../contracts"
import { Identifiers } from "../ioc"


@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.coreStatus";

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public async execute(params: object): Promise<any> {
        return {
            processStatus: await this.getProcessStatus()
        }
    }

    private getProcessStatus(): Contracts.ProcessState | undefined {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        console.log(processManager.list())

        return processManager.status("ark-core");
    }
}
