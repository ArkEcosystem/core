import { Logger, Shared, State } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";
export declare class WalletManager implements State.IWalletManager {
    logger: Logger.ILogger;
    protected readonly indexes: Record<string, State.IWalletIndex>;
    private currentBlock;
    constructor();
    registerIndex(name: string, indexer: State.WalletIndexer): void;
    unregisterIndex(name: string): void;
    getIndex(name: string): State.IWalletIndex;
    getIndexNames(): string[];
    allByAddress(): ReadonlyArray<State.IWallet>;
    allByPublicKey(): ReadonlyArray<State.IWallet>;
    allByUsername(): ReadonlyArray<State.IWallet>;
    findById(id: string): State.IWallet;
    findByAddress(address: string): State.IWallet;
    findByPublicKey(publicKey: string): State.IWallet;
    findByUsername(username: string): State.IWallet;
    findByIndex(index: string | string[], key: string): State.IWallet | undefined;
    has(key: string): boolean;
    hasByAddress(address: string): boolean;
    hasByPublicKey(publicKey: string): boolean;
    hasByUsername(username: string): boolean;
    hasByIndex(indexName: string, key: string): boolean;
    getNonce(publicKey: string): Utils.BigNumber;
    forgetByAddress(address: string): void;
    forgetByPublicKey(publicKey: string): void;
    forgetByUsername(username: string): void;
    forgetByIndex(indexName: string, key: string): void;
    index(wallets: ReadonlyArray<State.IWallet>): void;
    reindex(wallet: State.IWallet): void;
    getCurrentBlock(): Readonly<Interfaces.IBlock>;
    clone(): WalletManager;
    loadActiveDelegateList(roundInfo: Shared.IRoundInfo): State.IWallet[];
    buildVoteBalances(): void;
    applyBlock(block: Interfaces.IBlock): Promise<void>;
    revertBlock(block: Interfaces.IBlock): Promise<void>;
    applyTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    revertTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    canBePurged(wallet: State.IWallet): boolean;
    reset(): void;
    buildDelegateRanking(roundInfo?: Shared.IRoundInfo): State.IWallet[];
    /**
     * Updates the vote balances of the respective delegates of sender and recipient.
     * If the transaction is not a vote...
     *    1. fee + amount is removed from the sender's delegate vote balance
     *    2. amount is added to the recipient's delegate vote balance
     *
     * in case of a vote...
     *    1. the full sender balance is added to the sender's delegate vote balance
     *
     * If revert is set to true, the operations are reversed (plus -> minus, minus -> plus).
     */
    private updateVoteBalances;
}
