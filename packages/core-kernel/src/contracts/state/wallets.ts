import { Interfaces, Utils } from "@arkecosystem/crypto";

import { QueryParameters } from "../database/search";
import { RoundInfo } from "../shared";

export interface WalletIndex {
    readonly indexer: WalletIndexer;
    index(wallet: Wallet): void;
    has(key: string): boolean;
    get(key: string): Wallet | undefined;
    set(key: string, wallet: Wallet): void;
    forget(key: string): void;
    entries(): ReadonlyArray<[string, Wallet]>;
    values(): ReadonlyArray<Wallet>;
    keys(): string[];
    clear(): void;
    clone(): WalletIndex;
}

export type WalletIndexer = (index: WalletIndex, wallet: Wallet) => void;

export enum WalletIndexes {
    Addresses = "addresses",
    PublicKeys = "publicKeys",
    Usernames = "usernames",
    Resignations = "resignations",
    Locks = "locks",
}

export interface Wallet {
    address: string;
    publicKey: string | undefined;
    balance: Utils.BigNumber;
    nonce: Utils.BigNumber;

    applyBlock(block: Interfaces.IBlockData): boolean;
    revertBlock(block: Interfaces.IBlockData): boolean;

    auditApply(transaction: Interfaces.ITransactionData): any[];
    toString(): string;

    getAttributes();
    getAttribute<T = any>(key: string, defaultValue?: T): T;
    setAttribute<T = any>(key: string, value: T): boolean;
    forgetAttribute(key: string): boolean;
    hasAttribute(key: string): boolean;

    isDelegate(): boolean;
    hasVoted(): boolean;
    hasSecondSignature(): boolean;
    hasMultiSignature(): boolean;

    canBePurged(): boolean;

    clone(): Wallet;

    verifySignatures(
        transaction: Interfaces.ITransactionData,
        multisignature?: Interfaces.IMultiSignatureAsset,
    ): boolean;

    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet.
     * Throw an exception if it is not.
     */
    verifyTransactionNonceApply(transaction: Interfaces.ITransaction): void;

    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet.
     * Throw an exception if it is not.
     */
    verifyTransactionNonceRevert(transaction: Interfaces.ITransaction): void;
}

export interface WalletDelegateAttributes {
    username: string;
    voteBalance: Utils.BigNumber;
    forgedFees: Utils.BigNumber;
    forgedRewards: Utils.BigNumber;
    producedBlocks: number;
    rank?: number;
    lastBlock?: Interfaces.IBlockData;
    round?: number;
    resigned?: boolean;
}

export type WalletMultiSignatureAttributes = Interfaces.IMultiSignatureAsset & { legacy?: boolean };

export interface WalletIpfsAttributes {
    [hash: string]: boolean;
}

export interface WalletRepository {
    // TODO: use a inversify factory for wallets instead?
    createWallet(address: string): Wallet;

    reset(): void;

    registerIndex(name: string, indexer: WalletIndexer): void;

    unregisterIndex(name: string): void;

    getIndex(name: string): WalletIndex;

    allByAddress(): ReadonlyArray<Wallet>;

    allByPublicKey(): ReadonlyArray<Wallet>;

    allByUsername(): ReadonlyArray<Wallet>;

    findById(id: string): Wallet;

    findByAddress(address: string): Wallet;

    has(key: string): boolean;

    hasByIndex(indexName: string, key: string): boolean;

    getIndexNames(): string[];

    findByPublicKey(publicKey: string): Wallet;

    findByUsername(username: string): Wallet;

    findByIndex(index: string | string[], key: string): Wallet;

    getNonce(publicKey: string): Utils.BigNumber;

    index(wallets: ReadonlyArray<Wallet>): void;

    reindex(wallet: Wallet): void;

    clone(): TempWalletRepository;

    forgetByAddress(address: string): void;

    forgetByPublicKey(publicKey: string): void;

    forgetByUsername(username: string): void;

    forgetByIndex(indexName: string, key: string): void;

    hasByAddress(address: string): boolean;

    hasByPublicKey(publicKey: string): boolean;

    hasByUsername(username: string): boolean;

    search<T>(scope: SearchScope, params: QueryParameters): RowsPaginated<T>;

    findByScope(searchScope: SearchScope, id: string): Wallet;

    count(searchScope: SearchScope): number;

    top(searchScope: SearchScope, params?: Record<string, any>): RowsPaginated<Wallet>;
}

export interface TempWalletRepository extends WalletRepository {
    getActiveDelegatesOfPreviousRound(blocks: Interfaces.IBlock[], roundInfo: RoundInfo): Promise<Wallet[]>;
}

export interface WalletState {
    init(walletRepository: WalletRepository): WalletState;

    loadActiveDelegateList(roundInfo: RoundInfo): Wallet[];

    buildVoteBalances(): void;

    buildDelegateRanking(roundInfo?: RoundInfo): Wallet[];
}

export enum SearchScope {
    Wallets,
    Delegates,
    Locks,
    Businesses,
    Bridgechains,
}

export interface RowsPaginated<T> {
    rows: ReadonlyArray<T>;
    count: number;
}

export interface SearchContext<T = any> {
    query: Record<string, string[]>;
    entries: ReadonlyArray<T>;
    defaultOrder: string[];
}

export interface UnwrappedHtlcLock {
    lockId: string;
    senderPublicKey: string;
    amount: Utils.BigNumber;
    recipientId: string;
    secretHash: string;
    timestamp: number;
    expirationType: number;
    expirationValue: number;
    vendorField: string;
}
