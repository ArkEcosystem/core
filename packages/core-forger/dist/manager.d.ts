import { P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { Delegate } from "./delegate";
export declare class ForgerManager {
    private readonly logger;
    private readonly config;
    private secrets;
    private network;
    private client;
    private delegates;
    private usernames;
    private isStopped;
    private round;
    private initialized;
    constructor(options: any);
    startForging(bip38: string, password: string): Promise<void>;
    stopForging(): Promise<void>;
    checkSlot(): Promise<void>;
    forgeNewBlock(delegate: Delegate, round: P2P.ICurrentRound, networkState: P2P.INetworkState): Promise<void>;
    getTransactionsForForging(): Promise<Interfaces.ITransactionData[]>;
    isForgingAllowed(networkState: P2P.INetworkState, delegate: Delegate): boolean;
    private isActiveDelegate;
    private loadRound;
    private checkLater;
    private printLoadedDelegates;
}
