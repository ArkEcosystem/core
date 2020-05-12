
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
        let response = {
            height: await this.getHeight(),
        }

        try {
            response = {
                ...response,
                ...await this.prepareRandomNodeHeight(),
            }
        } catch (e) {

        }

        return response;
    }

    private async getHeight(): Promise<number> {
        const connection  = getConnectionData();
        const httpClient = new HttpClient(connection.protocol, connection.host, connection.port);

        let response = await httpClient.get("/api/blockchain");
        return response.data.block.height;
    }

    private async getRandomPeer(): Promise<{ip: string, port: number}> {
        const connection  = getConnectionData();
        const httpClient = new HttpClient(connection.protocol, connection.host, connection.port);

        let response = await httpClient.get("/api/peers");

        console.log("Response: ", response);

        return {
            ip: "142.93.231.13",
            port: 4003
        }


        // TODO: Check differences in responses between versions
        // if (response.totalCount > 0) {
        //     return {
        //         ip: response.data[0].ip,
        //         port: response.data[0].port
        //     }
        // }
        //
        // return undefined;
    }

    private async getRandomNodeHeight(connection: {ip: string, port: number, protocol: string}): Promise<number> {
        const httpClient = new HttpClient(connection.protocol, connection.ip, connection.port);

        let response = await httpClient.get("/api/blockchain");

        return response.data.block.height;
    }

    private async prepareRandomNodeHeight(): Promise<{randomNodeHeight: number, randomNodeIp: string}> {
        let connection = await this.getRandomPeer();
        // @ts-ignore
        connection.protocol = "http";

        return {
            // @ts-ignore
            randomNodeHeight: await this.getRandomNodeHeight(connection),
            randomNodeIp: connection.ip
        }
    }
}
