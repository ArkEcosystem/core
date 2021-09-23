import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Interfaces } from "@arkecosystem/crypto";
export declare class WalletManager extends Wallets.WalletManager {
    private readonly databaseService;
    constructor();
    findByAddress(address: string): State.IWallet;
    findByIndex(index: string | string[], key: string): State.IWallet | undefined;
    forget(publicKey: string): void;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction): Promise<void>;
    revertTransactionForSender(transaction: Interfaces.ITransaction): Promise<void>;
}
