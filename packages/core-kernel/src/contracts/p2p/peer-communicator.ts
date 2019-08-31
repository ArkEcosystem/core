import { Interfaces } from "@arkecosystem/crypto";

import { Peer } from "./peer";

export interface PeerCommunicator {
    ping(peer: Peer, timeoutMsec: number, force?: boolean): Promise<any>;
    pingPorts(peer: Peer): Promise<void>;
    downloadBlocks(peer: Peer, fromBlockHeight): Promise<any>;
    postBlock(peer: Peer, block: Interfaces.IBlockJson);
    postTransactions(peer: Peer, transactions: Interfaces.ITransactionJson[]): Promise<any>;
    getPeers(peer: Peer): Promise<any>;
    getPeerBlocks(
        peer: Peer,
        {
            fromBlockHeight,
            blockLimit,
            timeoutMsec,
            headersOnly,
        }: { fromBlockHeight: number; blockLimit?: number; timeoutMsec?: number; headersOnly?: boolean },
    ): Promise<any>;
    hasCommonBlocks(peer: Peer, ids: string[], timeoutMsec?: number): Promise<any>;
}
