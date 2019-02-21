import { models } from "@arkecosystem/crypto";
import { Logger } from "../index";

export interface IWalletManager {
    logger: Logger.ILogger;

    config: any;

    reset(): void;

    allByAddress(): models.Wallet[];

    allByPublicKey(): models.Wallet[];

    allByUsername(): models.Wallet[];

    findByAddress(address: string): models.Wallet;

    exists(addressOrPublicKey: string): boolean;

    findByPublicKey(publicKey: string): models.Wallet;

    findByUsername(username: string): models.Wallet;

    index(wallets: models.Wallet[]): void;

    reindex(wallet: models.Wallet): void;

    clear(): void;

    loadActiveDelegateList(maxDelegateCount: number, height?: number): any[];

    buildVoteBalances(): void;

    applyBlock(block: models.Block): void;

    revertBlock(block: models.Block): void;

    applyTransaction(transaction: models.Transaction);

    revertTransaction(transaction: models.Transaction);

    isDelegate(publicKey: string): boolean;

    canBePurged(wallet: models.Wallet): boolean;

    forgetByAddress(address: string): void;

    forgetByPublicKey(publicKey: string): void;

    forgetByUsername(username: string): void;

    setByAddress(address: string, wallet: models.Wallet): void;

    setByPublicKey(publicKey: string, wallet: models.Wallet): void;

    setByUsername(username: string, wallet: models.Wallet): void;

    purgeEmptyNonDelegates(): void;
}
