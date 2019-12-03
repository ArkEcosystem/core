import { Interfaces } from "@arkecosystem/crypto";
import { IPeer } from "./peer";

export interface IPeerCommunicator {
    ping(peer: IPeer, timeoutMsec: number, force?: boolean): Promise<any>;
    pingPorts(peer: IPeer): Promise<void>;
    postBlock(peer: IPeer, block: Interfaces.IBlock);
    postTransactions(peer: IPeer, transactions: Interfaces.ITransactionJson[]): Promise<any>;
    getPeers(peer: IPeer): Promise<any>;
    getPeerBlocks(
        peer: IPeer,
        {
            fromBlockHeight,
            blockLimit,
            timeoutMsec,
            headersOnly,
        }: { fromBlockHeight: number; blockLimit?: number; timeoutMsec?: number; headersOnly?: boolean },
    ): Promise<any>;
    hasCommonBlocks(peer: IPeer, ids: string[], timeoutMsec?: number): Promise<any>;
}
