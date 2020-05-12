
import { Container } from "@arkecosystem/core-kernel";
// import { Application, Container } from "@arkecosystem/core-kernel";
// import { Application as Cli, Container as CliContainer, Contracts, Services } from "@arkecosystem/core-cli";
import { Actions } from "../contracts"
// import { Identifiers } from "../ioc"
import { HttpClient, getConnectionData } from "../utils"


@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.blockchainHeight";

    // @Container.inject(Container.Identifiers.Application)
    // private readonly app!: Application;

    public async execute(params: any): Promise<any> {
        return {
            height: await this.getHeight(),
            ...await this.getRandomNodeHeight()
        }
    }

    private async getHeight(): Promise<number> {
        const connection  = getConnectionData();
        const httpClient = new HttpClient(connection.protocol, connection.host, connection.port);

        let response = await httpClient.get("/api/blockchain");
        return response.data.block.height;
    }

    private async getRandomNodeHeight(): Promise<{randomNodeHeight: number, randomNodeIp: string}> {
        return {
            randomNodeHeight: 1,
            randomNodeIp: "127.0.0.1"
        }
    }
}
