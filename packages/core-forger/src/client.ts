import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { NetworkState, NetworkStateStatus, socketEmit } from "@arkecosystem/core-p2p";
import { Interfaces } from "@arkecosystem/crypto";
import socketCluster from "socketcluster-client";

import { HostNoResponseError, RelayCommunicationError } from "./errors";
import { RelayHost } from "./interfaces";

// todo: review the implementation and make use of ioc
@Container.injectable()
export class Client {
    public hosts: RelayHost[];
    private host: RelayHost;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger: Contracts.Kernel.Log.Logger;

    init(hosts: RelayHost[]) {
        this.hosts = hosts.map(host => {
            host.socket = socketCluster.create({
                ...host,
                autoReconnectOptions: {
                    initialDelay: 1000,
                    maxDelay: 1000,
                },
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

    public async broadcastBlock(block: Interfaces.IBlockJson): Promise<void> {
        this.logger.debug(
            `Broadcasting block ${block.height.toLocaleString()} (${block.id}) with ${
                block.numberOfTransactions
            } transactions to ${this.host.hostname}`,
        );

        try {
            await this.emit("p2p.peer.postBlock", { block });
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

    public async getRound(): Promise<Contracts.P2P.CurrentRound> {
        await this.selectHost();

        return this.emit<Contracts.P2P.CurrentRound>("p2p.internal.getCurrentRound");
    }

    public async getNetworkState(): Promise<Contracts.P2P.NetworkState> {
        try {
            return NetworkState.parse(
                await this.emit<Contracts.P2P.NetworkState>("p2p.internal.getNetworkState", {}, 4000),
            );
        } catch (err) {
            return new NetworkState(NetworkStateStatus.Unknown);
        }
    }

    public async getTransactions(): Promise<Contracts.P2P.ForgingTransactions> {
        return this.emit<Contracts.P2P.ForgingTransactions>("p2p.internal.getUnconfirmedTransactions");
    }

    public async emitEvent(
        event: string,
        body: { error: string } | { activeDelegates: string[] } | Interfaces.IBlockData | Interfaces.ITransactionData,
    ): Promise<void> {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.

        const allowedHosts: string[] = ["127.0.0.1", "::ffff:127.0.0.1"];

        const host: RelayHost = this.hosts.find(item =>
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

            await Utils.sleep(100);
        }

        this.logger.debug(
            `No open socket connection to any host: ${JSON.stringify(
                this.hosts.map(host => `${host.hostname}:${host.port}`),
            )}.`,
        );

        throw new HostNoResponseError(this.hosts.map(host => host.hostname).join());
    }

    private async emit<T = object>(event: string, data: Record<string, any> = {}, timeout = 4000): Promise<T> {
        try {
            const response: Contracts.P2P.Response<T> = await socketEmit(
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
