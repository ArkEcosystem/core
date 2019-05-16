import { app } from "@arkecosystem/core-container";
import { Blockchain, EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { dato } from "@faustbrian/dato";
import AJV from "ajv";
import { SCClientSocket } from "socketcluster-client";
import { SocketErrors } from "./enums";
import { PeerPingTimeoutError, PeerStatusResponseError, PeerVerificationFailedError } from "./errors";
import { PeerVerifier } from "./peer-verifier";
import { replySchemas } from "./schemas";
import { socketEmit } from "./utils";

export class PeerCommunicator implements P2P.IPeerCommunicator {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    constructor(private readonly connector: P2P.IPeerConnector) {}

    public async downloadBlocks(peer: P2P.IPeer, fromBlockHeight: number): Promise<Interfaces.IBlockData[]> {
        try {
            this.logger.info(`Downloading blocks from height ${fromBlockHeight.toLocaleString()} via ${peer.ip}`);

            return await this.getPeerBlocks(peer, fromBlockHeight);
        } catch (error) {
            this.logger.error(`Could not download blocks from ${peer.url}: ${error.message}`);

            this.emitter.emit("internal.p2p.suspendPeer", { peer, punishment: "failedBlocksDownload" });

            throw error;
        }
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

        const body: any = await this.emit(peer, "p2p.peer.getStatus", undefined, timeoutMsec);

        if (!body) {
            throw new PeerStatusResponseError(peer.ip);
        }

        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            const peerVerifier = new PeerVerifier(this, peer);

            if (deadline <= new Date().getTime()) {
                throw new PeerPingTimeoutError(timeoutMsec);
            }

            peer.verificationResult = await peerVerifier.checkState(body, deadline);

            if (!peer.isVerified()) {
                throw new PeerVerificationFailedError();
            }
        }

        peer.lastPinged = dato();
        peer.state = body;
        return body;
    }

    public async getPeers(peer: P2P.IPeer): Promise<any> {
        this.logger.info(`Fetching a fresh peer list from ${peer.url}`);

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

            this.emitter.emit("internal.p2p.suspendPeer", { peer, punishment: "noCommonBlocks" });
        }

        return false;
    }

    public async getPeerBlocks(
        peer: P2P.IPeer,
        afterBlockHeight: number,
        timeoutMsec?: number,
    ): Promise<Interfaces.IBlockData[]> {
        return this.emit(peer, "p2p.peer.getBlocks", {
            lastBlockHeight: afterBlockHeight,
            headers: peer.headers,
            timeout: timeoutMsec || 10000,
        });
    }

    private parseHeaders(peer: P2P.IPeer, response): void {
        for (const key of ["version"]) {
            peer[key] = response.headers[key] || peer[key];
        }

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

        const ajv = new AJV();
        const errors = ajv.validate(schema, reply) ? undefined : ajv.errorsText();

        if (errors) {
            this.logger.error(`Got unexpected reply from ${peer.url}/${endpoint}: ${errors}`);
            return false;
        }

        return true;
    }

    private async emit(peer: P2P.IPeer, event: string, data?: any, timeout?: number) {
        let response;
        try {
            this.connector.forgetError(peer);

            const timeBeforeSocketCall = new Date().getTime();

            this.updateHeaders(peer);

            const connection: SCClientSocket = this.connector.connect(peer);
            response = await socketEmit(peer.ip, connection, event, data, peer.headers, timeout);

            peer.latency = new Date().getTime() - timeBeforeSocketCall;
            this.parseHeaders(peer, response);

            if (!this.validateReply(peer, response.data, event)) {
                throw new Error(`Response validation failed from peer ${peer.ip} : ${JSON.stringify(response.data)}`);
            }
        } catch (e) {
            this.handleSocketError(peer, e);
            return undefined;
        }

        return response.data;
    }

    private updateHeaders(peer: P2P.IPeer) {
        if (app.has("blockchain")) {
            const lastBlock: Interfaces.IBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

            if (lastBlock) {
                peer.headers.height = lastBlock.data.height;
            }
        }
    }

    private handleSocketError(peer: P2P.IPeer, error: Error): void {
        if (!error.name) {
            return;
        }

        this.connector.setError(peer, error.name);

        switch (error.name) {
            case SocketErrors.Validation:
                this.logger.error(`Socket data validation error (peer ${peer.ip}) : ${error.message}`);
                // don't suspend peer for validation error
                break;
            case "TimeoutError": // socketcluster timeout error
            case SocketErrors.Timeout:
                peer.latency = -1;
                this.emitter.emit("internal.p2p.suspendPeer", { peer });
                break;
            case "Error":
            case "CoreSocketNotOpenError":
                this.emitter.emit("internal.p2p.suspendPeer", { peer });
                break;
            default:
                this.logger.error(`Socket error (peer ${peer.ip}) : ${error.message}`);
                this.emitter.emit("internal.p2p.suspendPeer", { peer });
        }
    }
}
