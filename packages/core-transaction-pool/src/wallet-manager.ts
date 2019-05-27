import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Interfaces } from "@arkecosystem/crypto";

export class WalletManager extends Wallets.WalletManager {
    private readonly databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>(
        "database",
    );

    public findByAddress(address: string): State.IWallet {
        if (address && !this.byAddress[address]) {
            this.reindex(
                Object.assign(new Wallets.Wallet(address), this.databaseService.walletManager.findByAddress(address)),
            );
        }

        return this.byAddress[address];
    }

    public forget(publicKey: string): void {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(Identities.Address.fromPublicKey(publicKey));
    }

    public senderIsKnownAndTrxCanBeApplied(transaction: Interfaces.ITransaction): void {
        // Edge case if sender is unknown and has no balance.
        // NOTE: Check is performed against the database wallet manager.
        const senderPublicKey: string = transaction.data.senderPublicKey;
        if (!this.databaseService.walletManager.has(senderPublicKey)) {
            const senderAddress: string = Identities.Address.fromPublicKey(senderPublicKey);

            if (this.databaseService.walletManager.findByAddress(senderAddress).balance.isZero()) {
                const message: string = "Wallet not allowed to spend before funding is confirmed.";

                this.logger.error(message);

                throw new Error(message);
            }
        }

        const sender: State.IWallet = this.findByPublicKey(senderPublicKey);

        Handlers.Registry.get(transaction.type).throwIfCannotBeApplied(transaction, sender, this.databaseService.walletManager);
    }

    public revertTransactionForSender(transaction: Interfaces.ITransaction): void {
        Handlers.Registry.get(transaction.type).revertForSender(transaction, this);
    }
}
