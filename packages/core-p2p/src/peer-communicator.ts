import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
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

export class PeerCommunicator implements P2P.IPeerCommunicator {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    constructor(private readonly connector: P2P.IPeerConnector) {}

    public async downloadBlocks(peer: P2P.IPeer, fromBlockHeight: number): Promise<Interfaces.IBlockData[]> {
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

    public async postBlock(peer: P2P.IPeer, block: Interfaces.IBlockJson) {
        return this.emit(peer, "p2p.peer.postBlock", { block }, 5000);
    }

    public async postTransactions(peer: P2P.IPeer, transactions: Interfaces.ITransactionJson[]): Promise<any> {
        return this.emit(peer, "p2p.peer.postTransactions", { transactions });
    }

    public async ping(peer: P2P.IPeer, timeoutMsec: number, force: boolean = false): Promise<any> {
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

    public async pingPorts(peer: P2P.IPeer): Promise<void> {
        Promise.all(
            Object.entries(peer.plugins).map(async ([name, plugin]) => {
                try {
                    let valid: boolean = false;

                    if (name.includes("core-api") || name.includes("core-wallet-api")) {
                        const { body, status } = await httpie.get(
                            `http://${peer.ip}:${plugin.port}/api/node/configuration`,
                        );

                        if (status === 200) {
                            if (body.data.nethash === Managers.configManager.get("network.nethash")) {
                                valid = true;
                            } else {
                                this.logger.debug("Disconnecting from peer, because api returned a different nethash.");
                                this.emitter.emit("internal.p2p.disconnectPeer", { peer });
                            }
                        }
                    } else {
                        const { status } = await httpie.get(`http://${peer.ip}:${plugin.port}/`);
                        valid = status === 200;
                    }

                    if (valid) {
                        peer.ports[name] = plugin.port;
                    }
                } catch (error) {
                    peer.ports[name] = -1;
                }
            }),
        );
    }

    public validatePeerConfig(peer: P2P.IPeer, config: IPeerConfig): boolean {
        if (config.network.nethash !== app.getConfig().get("network.nethash")) {
            return false;
        }

        peer.version = config.version;

        if (!isValidVersion(peer)) {
            return false;
        }

        return true;
    }

    public async getPeers(peer: P2P.IPeer): Promise<any> {
        this.logger.debug(`Fetching a fresh peer list from ${peer.url}`);

        return this.emit(peer, "p2p.peer.getPeers");
    }

    public async hasCommonBlocks(peer: P2P.IPeer, ids: string[], timeoutMsec?: number): Promise<any> {
        try {
            const body: any = await this.emit(peer, "p2p.peer.getCommonBlocks", { ids }, timeoutMsec);

            if (!body || !body.common) {
                return false;
            }

            return body.common;
        } catch (error) {
            const sfx = timeoutMsec !== undefined ? ` within ${timeoutMsec} ms` : "";

            this.logger.error(`Could not determine common blocks with ${peer.ip}${sfx}: ${error.message}`);

            this.emitter.emit("internal.p2p.disconnectPeer", { peer });
        }

        return false;
    }

    public async getPeerBlocks(
        peer: P2P.IPeer,
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
            app.resolveOptions("p2p").getBlocksTimeout,
        );

        if (!peerBlocks) {
            this.logger.debug(
                `Peer ${peer.ip} did not return any blocks via height ${fromBlockHeight.toLocaleString()}.`,
            );
            return [];
        }

        for (const block of peerBlocks) {
            if (!block.transactions) {
                continue;
            }

            block.transactions = block.transactions.map(transaction => {
                const { data } = Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(transaction, "hex"));
                data.blockId = block.id;
                return data;
            });
        }

        return peerBlocks;
    }

    private parseHeaders(peer: P2P.IPeer, response): void {
        if (response.headers.height) {
            peer.state.height = +response.headers.height;
        }
    }

    private validateReply(peer: P2P.IPeer, reply: any, endpoint: string): boolean {
        const schema = replySchemas[endpoint];
        if (schema === undefined) {
            this.logger.error(`Can't validate reply from "${endpoint}": none of the predefined schemas matches.`);
            return false;
        }

        const { error } = Validation.validator.validate(schema, reply);
        if (error) {
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.debug(`Got unexpected reply from ${peer.url}/${endpoint}: ${error}`);
            }

            return false;
        }

        return true;
    }

    private async emit(peer: P2P.IPeer, event: string, data?: any, timeout?: number) {
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

    private handleSocketError(peer: P2P.IPeer, event: string, error: Error): void {
        if (!error.name) {
            return;
        }

        this.connector.setError(peer, error.name);

        switch (error.name) {
            case SocketErrors.Validation:
                this.logger.debug(`Socket data validation error (peer ${peer.ip}) : ${error.message}`);
                break;
            case "Error":
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Response error (peer ${peer.ip}/${event}) : ${error.message}`);
                }
                break;
            default:
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Socket error (peer ${peer.ip}) : ${error.message}`);
                }
                this.emitter.emit("internal.p2p.disconnectPeer", { peer });
        }
    }
}
