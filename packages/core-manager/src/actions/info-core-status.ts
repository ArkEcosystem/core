import { Application as Cli, Container as CliContainer, Contracts, Services } from "@arkecosystem/core-cli";
import { Application, Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { Identifiers } from "../ioc";
import { getConnectionData, HttpClient } from "../utils";

interface Params {
    token: string;
    process: string;
}

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "info.coreStatus";

    public schema = {
        type: "object",
        properties: {
            token: {
                type: "string",
            },
            process: {
                type: "string",
            },
        },
    };

    public async execute(params: Partial<Params>): Promise<any> {
        params = {
            token: this.app.token(),
            process: "core",
            ...params,
        };

        return {
            processStatus: this.getProcessStatus(params.token!, params.process!) || "undefined",
            syncing: await this.getSyncingStatus(),
        };
    }

    private getProcessStatus(token: string, process: string): Contracts.ProcessState | undefined {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        return processManager.status(`${token}-${process}`);
    }

    private async getSyncingStatus(): Promise<boolean | undefined> {
        const httpClient = new HttpClient(getConnectionData());

        try {
            const response = await httpClient.get("/api/node/syncing");

            return response.data.syncing;
        } catch (err) {
            return undefined;
        }
    }
}
