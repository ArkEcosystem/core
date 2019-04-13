import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { InvalidMultiSignatureError, MultiSignatureAlreadyRegisteredError } from "../errors";
import { TransactionHandler } from "./transaction";

export class MultiSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.MultiSignatureRegistrationTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        const { data } = transaction;
        if (wallet.multisignature) {
            throw new MultiSignatureAlreadyRegisteredError();
        }

        const { publicKeys, min } = data.asset.multisignature;

        if (!wallet.verifySignatures(data, data.asset.multisignature)) {
            throw new InvalidMultiSignatureError();
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        wallet.multisignature = transaction.data.asset.multisignature;
    }

    public revert(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        wallet.multisignature = null;
    }
}
