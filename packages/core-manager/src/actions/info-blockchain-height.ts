import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { ConnectionData } from "../contracts/http-client";
import { getConnectionData, HttpClient } from "../utils";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.blockchainHeight";

    public async execute(params: any): Promise<any> {
        let response = {
            height: await this.getNodeHeight(getConnectionData()),
        };

        try {
            response = {
                ...response,
                ...(await this.prepareRandomNodeHeight()),
            };
        } catch (e) {}

        return response;
    }

    private async getNodeHeight(connectionData: ConnectionData): Promise<number> {
        const httpClient = new HttpClient(connectionData);

        const response = await httpClient.get("/api/blockchain");

        return response.data.block.height;
    }

    private async getRandomPeer(): Promise<ConnectionData> {
        const httpClient = new HttpClient(getConnectionData());

        const response = await httpClient.get("/api/peers");

        const data = response.data as Contracts.P2P.Peer[];

        const peer = data.find(
            (x) => x.ports?.["@arkecosystem/core-api"] !== undefined && x.ports?.["@arkecosystem/core-api"] > 1,
        ) as Contracts.P2P.Peer;

        return {
            ip: peer.ip,
            port: peer.port,
            protocol: peer.port > 8000 ? "http" : "https",
        };
    }

    private async prepareRandomNodeHeight(): Promise<{ randomNodeHeight: number; randomNodeIp: string }> {
        const connection = await this.getRandomPeer();

        return {
            randomNodeHeight: await this.getNodeHeight(connection),
            randomNodeIp: connection.ip,
        };
    }
}
