import { Interfaces, Utils } from "@arkecosystem/crypto";

import { QueryParameters } from "../database/search";

// todo: review all interfaces in here and document them properly. Remove ones that are no longer needed.

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

export type WalletIndexerIndex = { name: string; indexer: WalletIndexer };

export enum WalletIndexes {
    Addresses = "addresses",
    PublicKeys = "publicKeys",
    Usernames = "usernames",
    Resignations = "resignations",
    Locks = "locks",
    Ipfs = "ipfs",
}

export interface Wallet {
    /**
     * @type {string}
     * @memberof Wallet
     */
    address: string;

    /**
     * @type {(string | undefined)}
     * @memberof Wallet
     */
    publicKey: string | undefined;

    /**
     * @type {Utils.BigNumber}
     * @memberof Wallet
     */
    balance: Utils.BigNumber;

    /**
     * @type {Utils.BigNumber}
     * @memberof Wallet
     */
    nonce: Utils.BigNumber;

    /**
     * @memberof Wallet
     */
    getAttributes();

    /**
     * @template T
     * @param {string} key
     * @param {T} [defaultValue]
     * @returns {T}
     * @memberof Wallet
     */
    getAttribute<T = any>(key: string, defaultValue?: T): T;

    /**
     * @template T
     * @param {string} key
     * @param {T} value
     * @returns {boolean}
     * @memberof Wallet
     */
    setAttribute<T = any>(key: string, value: T): boolean;

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Wallet
     */
    forgetAttribute(key: string): boolean;

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Wallet
     */
    hasAttribute(key: string): boolean;

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    isDelegate(): boolean;

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    hasVoted(): boolean;

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    hasSecondSignature(): boolean;

    /**
     * @returns {boolean}
     * @memberof Wallet
     */
    hasMultiSignature(): boolean;

    /**
     * @returns {Wallet}
     * @memberof Wallet
     */
    clone(): Wallet;
}

export type WalletFactory = (address: string) => Wallet;

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
    // TODO: use an inversify factory for wallets instead?
    createWallet(address: string): Wallet;

    reset(): void;

    getIndex(name: string): WalletIndex;

    allByAddress(): ReadonlyArray<Wallet>;

    allByPublicKey(): ReadonlyArray<Wallet>;

    allByUsername(): ReadonlyArray<Wallet>;

    findByAddress(address: string): Wallet;

    has(key: string): boolean;

    hasByIndex(indexName: string, key: string): boolean;

    getIndexNames(): string[];

    findByPublicKey(publicKey: string): Wallet;

    findByUsername(username: string): Wallet;

    findByIndex(index: string, key: string): Wallet;

    findByIndexes(indexes: string[], key: string): Wallet;

    getNonce(publicKey: string): Utils.BigNumber;

    index(wallets: ReadonlyArray<Wallet>): void;

    reindex(wallet: Wallet): void;

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
    isExpired: boolean;
    vendorField: string;
}
