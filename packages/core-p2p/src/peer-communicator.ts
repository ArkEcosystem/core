import { app, Contracts, Enums } from "@arkecosystem/core-kernel";
import { httpie } from "@arkecosystem/core-utils";
import { Interfaces, Managers, Transactions, Validation } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import { SCClientSocket } from "socketcluster-client";
import { SocketErrors } from "./enums";
import { PeerPingTimeoutError, PeerStatusResponseError, PeerVerificationFailedError } from "./errors";
import { IPeerConfig, IPeerPingResponse } from "./interfaces";
import { PeerVerifier } from "./peer-verifier";
import { replySchemas } from "./schemas";
import { isValidVersion, socketEmit } from "./utils";

export class PeerCommunicator implements Contracts.P2P.IPeerCommunicator {
    private readonly logger: Contracts.Kernel.ILogger = app.resolve<Contracts.Kernel.ILogger>("logger");
    private readonly emitter: Contracts.Kernel.IEventDispatcher = app.resolve<Contracts.Kernel.IEventDispatcher>(
        "events",
    );

    constructor(private readonly connector: Contracts.P2P.IPeerConnector) {}

    public async downloadBlocks(peer: Contracts.P2P.IPeer, fromBlockHeight: number): Promise<Interfaces.IBlockData[]> {
        this.logger.debug(`Downloading blocks from height ${fromBlockHeight.toLocaleString()} via ${peer.ip}`);

        let blocks: Interfaces.IBlockData[];
        try {
            blocks = await this.getPeerBlocks(peer, { fromBlockHeight });
        } catch {
            this.logger.debug(
                `Failed to download blocks from height ${fromBlockHeight.toLocaleString()} via ${peer.ip}.`,
            );
            blocks = [];
        }

        return blocks;
    }

    public async postBlock(peer: Contracts.P2P.IPeer, block: Interfaces.IBlockJson) {
        return this.emit(peer, "p2p.peer.postBlock", { block }, 5000);
    }

    public async postTransactions(
        peer: Contracts.P2P.IPeer,
        transactions: Interfaces.ITransactionJson[],
    ): Promise<any> {
        return this.emit(peer, "p2p.peer.postTransactions", { transactions });
    }

    public async ping(peer: Contracts.P2P.IPeer, timeoutMsec: number, force: boolean = false): Promise<any> {
        const deadline = new Date().getTime() + timeoutMsec;

        if (peer.recentlyPinged() && !force) {
            return undefined;
        }

        const pingResponse: IPeerPingResponse = await this.emit(peer, "p2p.peer.getStatus", undefined, timeoutMsec);

        if (!pingResponse) {
            throw new PeerStatusResponseError(peer.ip);
        }

        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            if (!this.validatePeerConfig(peer, pingResponse.config)) {
                throw new PeerVerificationFailedError();
            }

            const peerVerifier = new PeerVerifier(this, peer);

            if (deadline <= new Date().getTime()) {
                throw new PeerPingTimeoutError(timeoutMsec);
            }

            peer.verificationResult = await peerVerifier.checkState(pingResponse.state, deadline);

            if (!peer.isVerified()) {
                throw new PeerVerificationFailedError();
            }
        }

        peer.lastPinged = dayjs();
        peer.state = pingResponse.state;
        peer.plugins = pingResponse.config.plugins;

        return pingResponse.state;
    }

    public async pingPorts(peer: Contracts.P2P.IPeer): Promise<void> {
        Promise.all(
            Object.entries(peer.plugins).map(async ([name, plugin]) => {
                try {
                    const { status } = await httpie.get(`http://${peer.ip}:${plugin.port}/`);

                    if (status === 200) {
                        peer.ports[name] = plugin.port;
                    }
                } catch (error) {
                    peer.ports[name] = -1;
                }
            }),
        );
    }

    public validatePeerConfig(peer: Contracts.P2P.IPeer, config: IPeerConfig): boolean {
        if (config.network.nethash !== Managers.configManager.get("network.nethash")) {
            return false;
        }

        peer.version = config.version;

        if (!isValidVersion(peer)) {
            return false;
        }

        return true;
    }

    public async getPeers(peer: Contracts.P2P.IPeer): Promise<any> {
        this.logger.debug(`Fetching a fresh peer list from ${peer.url}`);

        return this.emit(peer, "p2p.peer.getPeers");
    }

    public async hasCommonBlocks(peer: Contracts.P2P.IPeer, ids: string[], timeoutMsec?: number): Promise<any> {
        try {
            const body: any = await this.emit(peer, "p2p.peer.getCommonBlocks", { ids }, timeoutMsec);

            if (!body || !body.common) {
                return false;
            }

            return body.common;
        } catch (error) {
            const sfx = timeoutMsec !== undefined ? ` within ${timeoutMsec} ms` : "";

            this.logger.error(`Could not determine common blocks with ${peer.ip}${sfx}: ${error.message}`);

            this.emitter.dispatch(Enums.Event.Internal.DisconnectPeer, { peer });
        }

        return false;
    }

    public async getPeerBlocks(
        peer: Contracts.P2P.IPeer,
        {
            fromBlockHeight,
            blockLimit,
            headersOnly,
        }: { fromBlockHeight: number; blockLimit?: number; headersOnly?: boolean },
    ): Promise<Interfaces.IBlockData[]> {
        const peerBlocks = await this.emit(
            peer,
            "p2p.peer.getBlocks",
            {
                lastBlockHeight: fromBlockHeight,
                blockLimit,
                headersOnly,
                serialized: true,
                headers: {
                    "Content-Type": "application/json",
                },
            },
            app.resolve("p2p.options").getBlocksTimeout,
        );

        if (!peerBlocks) {
            this.logger.debug(
                `Peer ${peer.ip} did not return any blocks via height ${fromBlockHeight.toLocaleString()}.`,
            );
            return [];
        }

        // To stay backward compatible, don't assume peers respond with serialized transactions just yet.
        // TODO: remove with 2.6
        for (const block of peerBlocks) {
            if (!block.transactions) {
                continue;
            }

            let transactions: Interfaces.ITransactionData[] = [];

            try {
                transactions = block.transactions.map(transaction => {
                    const { data } = Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(transaction, "hex"));
                    data.blockId = block.id;
                    return data;
                });
            } catch {
                transactions = block.transactions;
            }

            block.transactions = transactions;
        }

        return peerBlocks;
    }

    private parseHeaders(peer: Contracts.P2P.IPeer, response): void {
        if (response.headers.height) {
            peer.state.height = +response.headers.height;
        }
    }

    private validateReply(peer: Contracts.P2P.IPeer, reply: any, endpoint: string): boolean {
        const schema = replySchemas[endpoint];
        if (schema === undefined) {
            this.logger.error(`Can't validate reply from "${endpoint}": none of the predefined schemas matches.`);
            return false;
        }

        const { error } = Validation.validator.validate(schema, reply);
        if (error) {
            this.logger.error(`Got unexpected reply from ${peer.url}/${endpoint}: ${error}`);
            return false;
        }

        return true;
    }

    private async emit(peer: Contracts.P2P.IPeer, event: string, data?: any, timeout?: number) {
        let response;
        try {
            this.connector.forgetError(peer);

            const timeBeforeSocketCall: number = new Date().getTime();

            const connection: SCClientSocket = this.connector.connect(peer);
            response = await socketEmit(
                peer.ip,
                connection,
                event,
                data,
                {
                    "Content-Type": "application/json",
                },
                timeout,
            );

            peer.latency = new Date().getTime() - timeBeforeSocketCall;
            this.parseHeaders(peer, response);

            if (!this.validateReply(peer, response.data, event)) {
                throw new Error(`Response validation failed from peer ${peer.ip} : ${JSON.stringify(response.data)}`);
            }
        } catch (e) {
            this.handleSocketError(peer, event, e);
            return undefined;
        }

        return response.data;
    }

    private handleSocketError(peer: Contracts.P2P.IPeer, event: string, error: Error): void {
        if (!error.name) {
            return;
        }

        this.connector.setError(peer, error.name);

        switch (error.name) {
            case SocketErrors.Validation:
                this.logger.debug(`Socket data validation error (peer ${peer.ip}) : ${error.message}`);
                break;
            case "Error":
            case "CoreRateLimitExceededError":
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Response error (peer ${peer.ip}/${event}) : ${error.message}`);
                }
                break;
            default:
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Socket error (peer ${peer.ip}) : ${error.message}`);
                }
                this.emitter.dispatch(Enums.Event.Internal.DisconnectPeer, { peer });
        }
    }
}
