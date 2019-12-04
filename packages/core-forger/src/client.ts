import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { codec, NetworkState, NetworkStateStatus, socketEmit } from "@arkecosystem/core-p2p";
import { Blocks, Interfaces } from "@arkecosystem/crypto";
import delay from "delay";
import socketCluster from "socketcluster-client";
import { HostNoResponseError, RelayCommunicationError } from "./errors";
import { IRelayHost } from "./interfaces";

export class Client {
    public hosts: IRelayHost[];
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private host: IRelayHost;

    constructor(hosts: IRelayHost[]) {
        this.hosts = hosts.map(host => {
            host.socket = socketCluster.create({
                ...host,
                autoReconnectOptions: {
                    initialDelay: 1000,
                    maxDelay: 1000,
                },
                codecEngine: codec,
            });

            host.socket.on("error", err => {
                if (err.message !== "Socket hung up") {
                    this.logger.error(err.message);
                }
            });

            return host;
        });

        this.host = this.hosts[0];
    }

    public async broadcastBlock(block: Interfaces.IBlock): Promise<void> {
        this.logger.debug(
            `Broadcasting block ${block.data.height.toLocaleString()} (${block.data.id}) with ${
                block.data.numberOfTransactions
            } transactions to ${this.host.hostname}`,
        );

        try {
            await this.emit("p2p.peer.postBlock", {
                block: Blocks.Block.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map(tx => tx.data),
                }),
            });
        } catch (error) {
            this.logger.error(`Broadcast block failed: ${error.message}`);
        }
    }

    public async syncWithNetwork(): Promise<void> {
        await this.selectHost();

        this.logger.debug(`Sending wake-up check to relay node ${this.host.hostname}`);

        try {
            await this.emit("p2p.internal.syncBlockchain");
        } catch (error) {
            this.logger.error(`Could not sync check: ${error.message}`);
        }
    }

    public async getRound(): Promise<P2P.ICurrentRound> {
        await this.selectHost();

        return this.emit<P2P.ICurrentRound>("p2p.internal.getCurrentRound");
    }

    public async getNetworkState(): Promise<P2P.INetworkState> {
        try {
            return NetworkState.parse(await this.emit<P2P.INetworkState>("p2p.internal.getNetworkState", {}, 4000));
        } catch (err) {
            return new NetworkState(NetworkStateStatus.Unknown);
        }
    }

    public async getTransactions(): Promise<P2P.IForgingTransactions> {
        return this.emit<P2P.IForgingTransactions>("p2p.internal.getUnconfirmedTransactions");
    }

    public async emitEvent(
        event: string,
        body: { error: string } | { activeDelegates: string[] } | Interfaces.IBlockData | Interfaces.ITransactionData,
    ): Promise<void> {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.

        const allowedHosts: string[] = ["127.0.0.1", "::ffff:127.0.0.1"];

        const host: IRelayHost = this.hosts.find(item =>
            allowedHosts.some(allowedHost => item.hostname.includes(allowedHost)),
        );

        if (!host) {
            this.logger.error("emitEvent: unable to find any local hosts.");
            return;
        }

        try {
            await this.emit("p2p.internal.emitEvent", { event, body });
        } catch (error) {
            this.logger.error(`Failed to emit "${event}" to "${host.hostname}:${host.port}"`);
        }
    }

    public async selectHost(): Promise<void> {
        for (let i = 0; i < 10; i++) {
            for (const host of this.hosts) {
                if (host.socket.getState() === host.socket.OPEN) {
                    this.host = host;
                    return;
                }
            }

            await delay(100);
        }

        this.logger.debug(
            `No open socket connection to any host: ${JSON.stringify(
                this.hosts.map(host => `${host.hostname}:${host.port}`),
            )}.`,
        );

        throw new HostNoResponseError(this.hosts.map(host => host.hostname).join());
    }

    private async emit<T = object>(event: string, data: Record<string, any> = {}, timeout: number = 4000): Promise<T> {
        try {
            const response: P2P.IResponse<T> = await socketEmit(
                this.host.hostname,
                this.host.socket,
                event,
                data,
                {
                    "Content-Type": "application/json",
                },
                timeout,
            );

            return response.data;
        } catch (error) {
            throw new RelayCommunicationError(`${this.host.hostname}:${this.host.port}<${event}>`, error.message);
        }
    }
}
