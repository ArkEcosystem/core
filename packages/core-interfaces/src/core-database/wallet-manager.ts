import { Bignum, IMultiSignatureAsset, ITransactionData, models, Transaction } from "@arkecosystem/crypto";
import { Logger } from "../index";

export interface IWallet {
    address: string;
    publicKey: string | null;
    secondPublicKey: string | null;
    balance: Bignum;
    vote: string;
    voted: boolean;
    username: string | null;
    lastBlock: any;
    voteBalance: Bignum;
    multisignature?: IMultiSignatureAsset;
    dirty: boolean;
    producedBlocks: number;
    forgedFees: Bignum;
    forgedRewards: Bignum;
    rate?: number;

    verifySignatures(transaction: ITransactionData, multisignature: IMultiSignatureAsset): boolean;
}

export type IDelegateWallet = IWallet & { rate: number; round: number };

export interface IWalletManager {
    logger: Logger.ILogger;

    config: any;

    reset(): void;

    allByAddress(): IWallet[];

    allByPublicKey(): IWallet[];

    allByUsername(): IWallet[];

    findByAddress(address: string): IWallet;

    exists(addressOrPublicKey: string): boolean;

    findByPublicKey(publicKey: string): IWallet;

    findByUsername(username: string): IWallet;

    index(wallets: IWallet[]): void;

    reindex(wallet: IWallet): void;

    cloneDelegateWallets(): IWalletManager;

    loadActiveDelegateList(height: number): IDelegateWallet[];

    buildVoteBalances(): void;

    applyBlock(block: models.Block): void;

    revertBlock(block: models.Block): void;

    applyTransaction(transaction: Transaction): void;

    revertTransaction(transaction: Transaction): void;

    isDelegate(publicKey: string): boolean;

    canBePurged(wallet: IWallet): boolean;

    forgetByAddress(address: string): void;

    forgetByPublicKey(publicKey: string): void;

    forgetByUsername(username: string): void;

    setByAddress(address: string, wallet: IWallet): void;

    setByPublicKey(publicKey: string, wallet: IWallet): void;

    setByUsername(username: string, wallet: IWallet): void;

    purgeEmptyNonDelegates(): void;
}
