import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Logger, Shared } from "../index";
import { IRoundInfo } from "../shared";

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
    unsetAttribute(key: string): void;

    isDelegate(): boolean;
    hasVoted(): boolean;
    hasSecondSignature(): boolean;
    hasMultiSignature(): boolean;

    canBePurged(): boolean;

    verifySignatures(
        transaction: Interfaces.ITransactionData,
        multisignature?: Interfaces.IMultiSignatureAsset,
    ): boolean;
}

export interface IWalletDelegateAttributes {
    username: string;
    rank: number;
    voteBalance: Utils.BigNumber;
    forgedFees: Utils.BigNumber;
    forgedRewards: Utils.BigNumber;
    producedBlocks: number;
    lastBlock: Interfaces.IBlockData;
    round: number;
    resigned: boolean;
}

export type IWalletMultiSignatureAttributes = Interfaces.IMultiSignatureAsset;

export interface IWalletIpfsAttributes {
    [hash: string]: boolean;
}

export interface IWalletManager {
    logger: Logger.ILogger;

    reset(): void;

    allByAddress(): IWallet[];

    allByPublicKey(): IWallet[];

    allByUsername(): IWallet[];

    findById(id: string): IWallet;

    findByAddress(address: string): IWallet;

    has(addressOrPublicKey: string): boolean;

    findByPublicKey(publicKey: string): IWallet;

    findByUsername(username: string): IWallet;

    getNonce(publicKey: string): Utils.BigNumber;

    index(wallets: IWallet[]): void;

    reindex(wallet: IWallet): void;

    clone(): IWalletManager;

    loadActiveDelegateList(roundInfo: IRoundInfo): IWallet[];

    buildVoteBalances(): void;

    applyBlock(block: Interfaces.IBlock): void;

    buildDelegateRanking(roundInfo?: Shared.IRoundInfo): IWallet[];

    revertBlock(block: Interfaces.IBlock): void;

    applyTransaction(transaction: Interfaces.ITransaction): void;

    revertTransaction(transaction: Interfaces.ITransaction): void;

    canBePurged(wallet: IWallet): boolean;

    forgetByAddress(address: string): void;

    forgetByPublicKey(publicKey: string): void;

    forgetByUsername(username: string): void;

    hasByAddress(address: string): boolean;

    hasByPublicKey(publicKey: string): boolean;

    hasByUsername(username: string): boolean;

    purgeEmptyNonDelegates(): void;
}
