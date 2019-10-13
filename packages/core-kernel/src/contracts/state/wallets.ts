import { Interfaces, Utils } from "@arkecosystem/crypto";

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

    hasAttribute(key: string): boolean;
    getAttribute<T = any>(key: string, defaultValue?: T): T;
    setAttribute<T = any>(key: string, value: T): void;
    forgetAttribute(key: string): void;

    isDelegate(): boolean;
    hasVoted(): boolean;
    hasSecondSignature(): boolean;
    hasMultiSignature(): boolean;

    canBePurged(): boolean;

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

    findByIndex(index: string | string[], key: string): Wallet | undefined;

    getNonce(publicKey: string): Utils.BigNumber;

    index(wallets: ReadonlyArray<Wallet>): void;

    reindex(wallet: Wallet): void;

    clone(): WalletRepository;

    forgetByAddress(address: string): void;

    forgetByPublicKey(publicKey: string): void;

    forgetByUsername(username: string): void;

    forgetByIndex(indexName: string, key: string): void;

    hasByAddress(address: string): boolean;

    hasByPublicKey(publicKey: string): boolean;

    hasByUsername(username: string): boolean;
}
