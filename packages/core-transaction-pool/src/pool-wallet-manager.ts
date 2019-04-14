import { app } from "@arkecosystem/core-container";
import { Wallet, WalletManager } from "@arkecosystem/core-database";
import { Database } from "@arkecosystem/core-interfaces";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions";
import { Crypto, Interfaces, Utils } from "@arkecosystem/crypto";

const { crypto } = Crypto;

export class PoolWalletManager extends WalletManager {
    public readonly databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    /**
     * Get a wallet by the given address. If wallet is not found it is copied from blockchain
     * wallet manager. Method overrides base class method from WalletManager.
     * WARNING: call only upon guard apply, as if wallet not found it gets it from blockchain.
     * For existing key checks use function exists(key)
     * @param  {String} address
     * @return {(Wallet|null)}
     */
    public findByAddress(address): Database.IWallet {
        if (address && !this.byAddress[address]) {
            const blockchainWallet = this.databaseService.walletManager.findByAddress(address);
            const wallet = Object.assign(new Wallet(address), blockchainWallet); // do not modify

            this.reindex(wallet);
        }

        return this.byAddress[address];
    }

    public deleteWallet(publicKey) {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(crypto.getAddress(publicKey));
    }

    /**
     * Checks if the transaction can be applied.
     */
    public canApply(transaction: Interfaces.ITransaction, errors): boolean {
        // Edge case if sender is unknown and has no balance.
        // NOTE: Check is performed against the database wallet manager.
        if (!this.databaseService.walletManager.exists(transaction.data.senderPublicKey)) {
            const senderAddress = crypto.getAddress(transaction.data.senderPublicKey);

            if (this.databaseService.walletManager.findByAddress(senderAddress).balance.isZero()) {
                errors.push("Cold wallet is not allowed to send until receiving transaction is confirmed.");
                return false;
            }
        }

        const { data } = transaction;
        const sender = this.findByPublicKey(data.senderPublicKey);

        if (Utils.isException(data)) {
            this.logger.warn(
                `Transaction forcibly applied because it has been added as an exception: ${transaction.id}`,
            );
        } else {
            try {
                const transactionHandler = TransactionHandlerRegistry.get(transaction.type);
                transactionHandler.canBeApplied(transaction, sender, this.databaseService.walletManager);
            } catch (error) {
                const message = `[PoolWalletManager] Can't apply transaction ${transaction.id} from ${sender.address}`;
                this.logger.error(`${message} due to ${JSON.stringify(error.message)}`);
                errors.unshift(error.message);
            }
        }

        return errors.length === 0;
    }

    /**
     * Remove the given transaction from a sender only.
     */
    public revertTransactionForSender(transaction: Interfaces.ITransaction) {
        const { data } = transaction;
        const sender = this.findByPublicKey(data.senderPublicKey); // Should exist

        const transactionHandler = TransactionHandlerRegistry.get(transaction.type);
        transactionHandler.revertForSender(transaction, sender);
    }
}
