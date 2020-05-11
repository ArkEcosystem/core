
import { Application, Container } from "@arkecosystem/core-kernel";
import { Application as Cli, Container as CliContainer, Contracts, Services } from "@arkecosystem/core-cli";
import { Actions } from "../contracts"
import { Identifiers } from "../ioc"
import { HttpClient } from "../utils"


@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.coreStatus";

    public schema = {
        type: "object",
        properties: {
            token: {
                type: "string"
            }
        }
    }

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public async execute(params: any): Promise<any> {
        return {
            processStatus: this.getProcessStatus(params.token) || "undefined",
            syncing: await this.getSyncingStatus()
        }
    }

    private getProcessStatus(token: string = "ark"): Contracts.ProcessState | undefined {
        const cli = this.app.get<Cli>(Identifiers.CLI);

        const processManager = cli.get<Services.ProcessManager>(CliContainer.Identifiers.ProcessManager);

        return processManager.status(`${token}-core`);
    }

    private async getSyncingStatus(): Promise<boolean> {
        let connection  = this.getConnectionData();

        const httpClient = new HttpClient(connection.protocol, connection.host, connection.port);

        try {
            let result = await httpClient.get("/api/node/syncing");

            return result.data.syncing;
        } catch {
            return false;
        }
    }

    private getConnectionData(): { host: string, port: number | string, protocol: string } {
        if (!process.env.CORE_API_DISABLED) {
            return {
                host: process.env.CORE_API_HOST || "0.0.0.0",
                port: process.env.CORE_API_PORT || 4003,
                protocol: "http"
            }
        }

        return {
            host: process.env.CORE_API_SSL_HOST || "0.0.0.0",
            port: process.env.CORE_API_SSL_PORT || 8443,
            protocol: "https"
        }
    }
}
