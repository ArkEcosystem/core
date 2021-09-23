import { P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { IRelayHost } from "./interfaces";
export declare class Client {
    hosts: IRelayHost[];
    private readonly logger;
    private host;
    constructor(hosts: IRelayHost[]);
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    syncWithNetwork(): Promise<void>;
    getRound(): Promise<P2P.ICurrentRound>;
    getNetworkState(): Promise<P2P.INetworkState>;
    getTransactions(): Promise<P2P.IForgingTransactions>;
    emitEvent(event: string, body: {
        error: string;
    } | {
        activeDelegates: string[];
    } | Interfaces.IBlockData | Interfaces.ITransactionData): Promise<void>;
    selectHost(): Promise<void>;
    private emit;
}
