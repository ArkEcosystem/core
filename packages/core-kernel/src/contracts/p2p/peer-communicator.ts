import { Interfaces } from "@arkecosystem/crypto";

import { Peer } from "./peer";

export interface PeerCommunicator {
    initialize();

    postBlock(peer: Peer, block: Interfaces.IBlock);

    postTransactions(peer: Peer, transactions: Buffer[]): Promise<any>;

    ping(peer: Peer, timeoutMsec: number, force?: boolean): Promise<any>;

    pingPorts(peer: Peer): Promise<void>;

    getPeers(peer: Peer): Promise<any>;

    hasCommonBlocks(peer: Peer, ids: string[], timeoutMsec?: number): Promise<any>;

    getPeerBlocks(
        peer: Peer,
        {
            fromBlockHeight,
            blockLimit,
            headersOnly,
        }: { fromBlockHeight: number; blockLimit?: number; headersOnly?: boolean },
    ): Promise<Interfaces.IBlockData[]>;
}
