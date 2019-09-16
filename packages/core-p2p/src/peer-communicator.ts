import { app, Container, Contracts, Enums, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Validation } from "@arkecosystem/crypto";
import dayjs from "dayjs";
import { SCClientSocket } from "socketcluster-client";

import { SocketErrors } from "./enums";
import { PeerPingTimeoutError, PeerStatusResponseError, PeerVerificationFailedError } from "./errors";
import { PeerConfig, PeerPingResponse } from "./interfaces";
import { PeerVerifier } from "./peer-verifier";
import { replySchemas } from "./schemas";
import { isValidVersion, socketEmit } from "./utils";

@Container.injectable()
export class PeerCommunicator implements Contracts.P2P.PeerCommunicator {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerConnector)
    private readonly connector: Contracts.P2P.PeerConnector;

    public async downloadBlocks(peer: Contracts.P2P.Peer, fromBlockHeight: number): Promise<Interfaces.IBlockData[]> {
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

    public async postBlock(peer: Contracts.P2P.Peer, block: Interfaces.IBlockJson) {
        return this.emit(peer, "p2p.peer.postBlock", { block }, 5000);
    }

    public async postTransactions(peer: Contracts.P2P.Peer, transactions: Interfaces.ITransactionJson[]): Promise<any> {
        return this.emit(peer, "p2p.peer.postTransactions", { transactions });
    }

    public async ping(peer: Contracts.P2P.Peer, timeoutMsec: number, force = false): Promise<any> {
        const deadline = new Date().getTime() + timeoutMsec;

        if (peer.recentlyPinged() && !force) {
            return undefined;
        }

        const pingResponse: PeerPingResponse = await this.emit(peer, "p2p.peer.getStatus", undefined, timeoutMsec);

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

    public async pingPorts(peer: Contracts.P2P.Peer): Promise<void> {
        Promise.all(
            Object.entries(peer.plugins).map(async ([name, plugin]) => {
                try {
                    const { status } = await Utils.httpie.get(`http://${peer.ip}:${plugin.port}/`);

                    if (status === 200) {
                        peer.ports[name] = plugin.port;
                    }
                } catch (error) {
                    peer.ports[name] = -1;
                }
            }),
        );
    }

    public validatePeerConfig(peer: Contracts.P2P.Peer, config: PeerConfig): boolean {
        if (config.network.nethash !== Managers.configManager.get("network.nethash")) {
            return false;
        }

        peer.version = config.version;

        if (!isValidVersion(peer)) {
            return false;
        }

        return true;
    }

    public async getPeers(peer: Contracts.P2P.Peer): Promise<any> {
        this.logger.debug(`Fetching a fresh peer list from ${peer.url}`);

        return this.emit(peer, "p2p.peer.getPeers");
    }

    public async hasCommonBlocks(peer: Contracts.P2P.Peer, ids: string[], timeoutMsec?: number): Promise<any> {
        try {
            const body: any = await this.emit(peer, "p2p.peer.getCommonBlocks", { ids }, timeoutMsec);

            if (!body || !body.common) {
                return false;
            }

            return body.common;
        } catch (error) {
            const sfx = timeoutMsec !== undefined ? ` within ${timeoutMsec} ms` : "";

            this.logger.error(`Could not determine common blocks with ${peer.ip}${sfx}: ${error.message}`);

            this.emitter.dispatch(Enums.Events.Internal.DisconnectPeer, { peer });
        }

        return false;
    }

    public async getPeerBlocks(
        peer: Contracts.P2P.Peer,
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
            app.get<any>("p2p.options").getBlocksTimeout,
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

    private parseHeaders(peer: Contracts.P2P.Peer, response): void {
        if (response.headers.height) {
            peer.state.height = +response.headers.height;
        }
    }

    private validateReply(peer: Contracts.P2P.Peer, reply: any, endpoint: string): boolean {
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

    private async emit(peer: Contracts.P2P.Peer, event: string, data?: any, timeout?: number) {
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

    private handleSocketError(peer: Contracts.P2P.Peer, event: string, error: Error): void {
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
                this.emitter.dispatch(Enums.Events.Internal.DisconnectPeer, { peer });
        }
    }
}
