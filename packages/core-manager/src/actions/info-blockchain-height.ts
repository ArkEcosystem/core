import { Container } from "@arkecosystem/core-kernel";

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

    private async getRandomPeer(): Promise<{ ip: string; height: number }> {
        const httpClient = new HttpClient(getConnectionData());

        const response = await httpClient.get("/api/peers");

        const data = response.data;

        if (data.length) {
            return data[Math.floor(Math.random() * data.length)];
        }

        throw new Error("No peers found.");
    }

    private async prepareRandomNodeHeight(): Promise<{ randomNodeHeight: number; randomNodeIp: string }> {
        const peer = await this.getRandomPeer();

        return {
            randomNodeHeight: peer.height,
            randomNodeIp: peer.ip,
        };
    }
}
