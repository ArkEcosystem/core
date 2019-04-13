import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { NetworkState, NetworkStateStatus, socketEmit } from "@arkecosystem/core-p2p";
import { Interfaces } from "@arkecosystem/crypto";
import delay from "delay";
import socketCluster from "socketcluster-client";
import { HostNoResponseError, RelayCommunicationError } from "./errors";
import { IRelaySocket } from "./interfaces";

export class Client {
    public hosts: IRelaySocket[];
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private host: IRelaySocket;
    private headers: {
        version: string;
        port: number;
        nethash: string;
        "Content-Type": "application/json";
    };

    constructor(hosts) {
        this.hosts = Array.isArray(hosts) ? hosts : [hosts];

        const { port, ip } = this.hosts[0];

        if (!port || !ip) {
            throw new Error("Failed to determine the P2P communication port / ip.");
        }

        this.hosts.forEach(host => {
            host.socket = socketCluster.create({
                port: host.port,
                hostname: host.ip,
            });

            host.socket.on("error", err => this.logger.error(err.message));
        });

        this.host = this.hosts[0];

        this.headers = {
            version: app.getVersion(),
            port: +port,
            nethash: app.getConfig().get("network.nethash"),
            "Content-Type": "application/json",
        };
    }

    public async broadcastBlock(block: Interfaces.IBlockData): Promise<void> {
        this.logger.debug(
            `Broadcasting forged block id:${block.id} at height:${block.height.toLocaleString()} with ${
                block.numberOfTransactions
            } transactions to ${this.host.ip}`,
        );

        try {
            await this.emit("p2p.peer.postBlock", { block });
        } catch (error) {
            this.logger.error(`Broadcast block failed: ${error.message}`);
        }
    }

    public async syncWithNetwork(): Promise<void> {
        await this.selectHost();

        this.logger.debug(`Sending wake-up check to relay node ${this.host.ip}`);

        try {
            await this.emit("p2p.internal.syncBlockchain");
        } catch (error) {
            this.logger.error(`Could not sync check: ${error.message}`);
        }
    }

    public async getRound(): Promise<P2P.ICurrentRound> {
        await this.selectHost();

        return this.emit<P2P.IResponse<P2P.ICurrentRound>>("p2p.internal.getCurrentRound");
    }

    public async getNetworkState(): Promise<P2P.INetworkState> {
        try {
            const response: P2P.IResponse<NetworkState> = await this.emit<P2P.IResponse<NetworkState>>(
                "p2p.internal.getNetworkState",
                {},
                4000,
            );

            return NetworkState.parse(response);
        } catch (e) {
            this.logger.error(
                `Could not retrieve network state: ${this.host.ip} p2p.internal.getNetworkState : ${e.message}`,
            );

            return new NetworkState(NetworkStateStatus.Unknown);
        }
    }

    public async getTransactions(): Promise<P2P.IForgingTransactions> {
        return this.emit<P2P.IResponse<P2P.IForgingTransactions>>("p2p.internal.getUnconfirmedTransactions");
    }

    public async emitEvent(
        event: string,
        body: string | Interfaces.IBlockData | Interfaces.ITransactionData,
    ): Promise<void> {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.

        const allowedHosts: string[] = ["127.0.0.1", "::ffff:127.0.0.1"];

        const host = this.hosts.find(item => allowedHosts.some(allowedHost => item.ip.includes(allowedHost)));

        if (!host) {
            this.logger.error("emitEvent: unable to find any local hosts.");
            return;
        }

        try {
            await this.emit("p2p.internal.emitEvent", { event, body });
        } catch (error) {
            this.logger.error(`Failed to emit "${event}" to "${host.ip}:${host.port}"`);
        }
    }

    public async selectHost(): Promise<void> {
        // if no socket is connected, we give it 1 second
        for (let i = 0; i < 10; i++) {
            for (const host of this.hosts) {
                if (host.socket.getState() === host.socket.OPEN) {
                    this.host = host;
                    return;
                }
            }

            await delay(100);
        }

        this.logger.debug(`No open socket connection to any host : ${this.hosts.map(host => host.ip).join()}.`);

        throw new HostNoResponseError(this.hosts.map(host => host.ip).join());
    }

    private async emit<T>(event: string, data: Record<string, any> = {}, timeout: number = 2000): Promise<any> {
        try {
            const response: any = await socketEmit(this.host.ip, this.host.socket, event, data, this.headers, timeout);
            return response.data;
        } catch (error) {
            throw new RelayCommunicationError(`${this.host.ip}:${this.host.port}<${event}>`, error.message);
        }
    }
}
