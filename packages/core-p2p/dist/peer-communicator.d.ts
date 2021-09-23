import { P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { IPeerConfig } from "./interfaces";
export declare class PeerCommunicator implements P2P.IPeerCommunicator {
    private readonly connector;
    private readonly logger;
    private readonly emitter;
    private outgoingRateLimiter;
    constructor(connector: P2P.IPeerConnector);
    postBlock(peer: P2P.IPeer, block: Interfaces.IBlock): Promise<any>;
    postTransactions(peer: P2P.IPeer, transactions: Interfaces.ITransactionJson[]): Promise<any>;
    ping(peer: P2P.IPeer, timeoutMsec: number, force?: boolean): Promise<any>;
    pingPorts(peer: P2P.IPeer): Promise<void>;
    validatePeerConfig(peer: P2P.IPeer, config: IPeerConfig): boolean;
    getPeers(peer: P2P.IPeer): Promise<any>;
    hasCommonBlocks(peer: P2P.IPeer, ids: string[], timeoutMsec?: number): Promise<any>;
    getPeerBlocks(peer: P2P.IPeer, { fromBlockHeight, blockLimit, headersOnly, }: {
        fromBlockHeight: number;
        blockLimit?: number;
        headersOnly?: boolean;
    }): Promise<Interfaces.IBlockData[]>;
    private parseHeaders;
    private validateReply;
    private emit;
    private throttle;
    private handleSocketError;
}
