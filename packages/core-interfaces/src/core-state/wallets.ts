import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Logger, Shared } from "../index";
import { IRoundInfo } from "../shared";

export type WalletIndexer = (index: IWalletIndex, wallet: IWallet) => void;

export enum WalletIndexes {
    Addresses = "addresses",
    PublicKeys = "publicKeys",
    Usernames = "usernames",
    Resignations = "resignations",
    Locks = "locks",
    Ipfs = "ipfs",
}

export interface IWallet {
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
    getAttributes(): Readonly<Record<string, any>>;

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

export interface IWalletDelegateAttributes {
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

export type IWalletMultiSignatureAttributes = Interfaces.IMultiSignatureAsset & { legacy?: boolean };

export interface IWalletIpfsAttributes {
    [hash: string]: boolean;
}

export interface IWalletManager {
    logger: Logger.ILogger;

    reset(): void;

    registerIndex(name: string, indexer: WalletIndexer): void;

    unregisterIndex(name: string): void;

    getIndex(name: string): IWalletIndex;

    allByAddress(): ReadonlyArray<IWallet>;

    allByPublicKey(): ReadonlyArray<IWallet>;

    allByUsername(): ReadonlyArray<IWallet>;

    findById(id: string): IWallet;

    findByAddress(address: string): IWallet;

    has(key: string): boolean;

    hasByIndex(indexName: string, key: string): boolean;

    getIndexNames(): string[];

    findByPublicKey(publicKey: string): IWallet;

    findByUsername(username: string): IWallet;

    findByIndex(index: string | string[], key: string): IWallet | undefined;

    getNonce(publicKey: string): Utils.BigNumber;

    index(wallets: ReadonlyArray<IWallet>): void;

    reindex(wallet: IWallet): void;

    getCurrentBlock(): Readonly<Interfaces.IBlock>;

    clone(): IWalletManager;

    loadActiveDelegateList(roundInfo: IRoundInfo): IWallet[];

    buildVoteBalances(): void;

    applyBlock(block: Interfaces.IBlock): Promise<void>;

    buildDelegateRanking(roundInfo?: Shared.IRoundInfo): IWallet[];

    revertBlock(block: Interfaces.IBlock): Promise<void>;

    applyTransaction(transaction: Interfaces.ITransaction): Promise<void>;

    revertTransaction(transaction: Interfaces.ITransaction): Promise<void>;

    canBePurged(wallet: IWallet): boolean;

    forgetByAddress(address: string): void;

    forgetByPublicKey(publicKey: string): void;

    forgetByUsername(username: string): void;

    forgetByIndex(indexName: string, key: string): void;

    hasByAddress(address: string): boolean;

    hasByPublicKey(publicKey: string): boolean;

    hasByUsername(username: string): boolean;
}

export interface IWalletIndex {
    readonly indexer: WalletIndexer;
    index(wallet: IWallet): void;
    has(key: string): boolean;
    get(key: string): IWallet | undefined;
    set(key: string, wallet: IWallet): void;
    forget(key: string): void;
    entries(): ReadonlyArray<[string, IWallet]>;
    values(): ReadonlyArray<IWallet>;
    keys(): string[];
    clear(): void;
}
