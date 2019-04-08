import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { NetworkState, NetworkStateStatus, socketEmit } from "@arkecosystem/core-p2p";
import { interfaces } from "@arkecosystem/crypto";
import delay from "delay";
import socketCluster from "socketcluster-client";
import { HostNoResponseError, RelayCommunicationError } from "./errors";

export class Client {
    public hosts: Array<{
        port: number;
        ip: string;
        socket: socketCluster.SCClientSocket;
    }>;
    private host: {
        port: number;
        ip: string;
        socket: socketCluster.SCClientSocket;
    };
    private headers: {
        version: string;
        port: number;
        nethash: string;
        "Content-Type": "application/json";
    };

    private logger: Logger.ILogger;

    /**
     * Create a new client instance.
     * @param  {(Array|String)} hosts - Host or Array of hosts
     */
    constructor(hosts) {
        this.hosts = Array.isArray(hosts) ? hosts : [hosts];
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");

        const { port, ip } = this.hosts[0];

        if (!port || !ip) {
            throw new Error("Failed to determine the P2P communication port / ip.");
        }

        this.hosts.forEach(host => {
            host.socket = socketCluster.create({
                port: host.port,
                hostname: host.ip,
            });

            host.socket.on("error", err => {
                // don't do anything but we need this error handler so that socket errors don't crash the app
                // (typically we catch here socket disconnection errors)
            });
        });

        this.host = this.hosts[0];

        this.headers = {
            version: app.getVersion(),
            port: +port,
            nethash: app.getConfig().get("network.nethash"),
            "Content-Type": "application/json",
        };
    }

    /**
     * Send the given block to the relay.
     */
    public async broadcast(block: interfaces.IBlockData): Promise<any> {
        this.logger.debug(
            `Broadcasting forged block id:${block.id} at height:${block.height.toLocaleString()} with ${
                block.numberOfTransactions
            } transactions to ${this.host.ip}`,
        );

        let response;
        try {
            response = this.emit("p2p.internal.storeBlock", { block });
        } catch (error) {
            this.logger.error(`Broadcast block failed: ${error.message}`);
        }
        return response;
    }

    /**
     * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
     */
    public async syncCheck(): Promise<void> {
        await this.selectHost();

        this.logger.debug(`Sending wake-up check to relay node ${this.host.ip}`);

        try {
            await this.emit("p2p.internal.syncBlockchain", {});
        } catch (error) {
            this.logger.error(`Could not sync check: ${error.message}`);
        }
    }

    /**
     * Get the current round.
     */
    public async getRound(): Promise<P2P.ICurrentRound> {
        await this.selectHost();

        const response = await this.emit<P2P.IResponse<P2P.ICurrentRound>>("p2p.internal.getCurrentRound", {});

        return response.data;
    }

    /**
     * Get the current network quorum.
     */
    public async getNetworkState(): Promise<P2P.INetworkState> {
        try {
            const response: any = await this.emit<P2P.IResponse<NetworkState>>(
                "p2p.internal.getNetworkState",
                {},
                4000,
            );

            return NetworkState.parse(response.data);
        } catch (e) {
            this.logger.error(
                `Could not retrieve network state: ${this.host.ip} p2p.internal.getNetworkState : ${e.message}`,
            );
            return new NetworkState(NetworkStateStatus.Unknown);
        }
    }

    /**
     * Get all transactions that are ready to be forged.
     */
    public async getTransactions(): Promise<P2P.IForgingTransactions> {
        const response = await this.emit<P2P.IResponse<P2P.IForgingTransactions>>(
            "p2p.internal.getUnconfirmedTransactions",
            {},
        );

        return response.data;
    }

    /**
     * Emit the given event and payload to the local host.
     */
    public async emitEvent(
        event: string,
        body: string | interfaces.IBlockData | interfaces.ITransactionData,
    ): Promise<void> {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.

        const allowedHosts = ["localhost", "127.0.0.1", "::ffff:127.0.0.1", "192.168.*"];

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

    /**
     * Chose a responsive host.
     */
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

        this.logger.debug(`No open socket connection to any host : ${this.hosts.map(h => h.ip).join()}.`);

        throw new HostNoResponseError(this.hosts.map(h => h.ip).join());
    }

    private async emit<T>(event: string, data: any, timeout: number = 2000) {
        try {
            const response: any = await socketEmit(this.host.socket, event, data, this.headers, timeout);
            return response.data;
        } catch (error) {
            throw new RelayCommunicationError(`${this.host.ip}:${this.host.port}<${event}>`, error.message);
        }
    }
}
