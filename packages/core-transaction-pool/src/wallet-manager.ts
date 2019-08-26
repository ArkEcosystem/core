import { app, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import clonedeep from "lodash.clonedeep";

export class WalletManager extends Wallets.WalletManager {
    private readonly databaseService: Contracts.Database.IDatabaseService = app.get<
        Contracts.Database.IDatabaseService
    >("database");

    public findByAddress(address: string): Contracts.State.IWallet {
        if (address && !this.hasByAddress(address)) {
            this.reindex(clonedeep(this.databaseService.walletManager.findByAddress(address)));
        }

        return this.findByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public forget(publicKey: string): void {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(Identities.Address.fromPublicKey(publicKey));
    }

    public async throwIfCannotBeApplied(transaction: Interfaces.ITransaction): Promise<void> {
        // Edge case if sender is unknown and has no balance.
        // NOTE: Check is performed against the database wallet manager.
        const senderPublicKey: string = transaction.data.senderPublicKey;
        if (!this.databaseService.walletManager.hasByPublicKey(senderPublicKey)) {
            const senderAddress: string = Identities.Address.fromPublicKey(senderPublicKey);

            if (this.databaseService.walletManager.findByAddress(senderAddress).balance.isZero()) {
                const message = "Wallet not allowed to spend before funding is confirmed.";

                this.logger.error(message);

                throw new Error(message);
            }
        }

        const sender: Contracts.State.IWallet = this.findByPublicKey(senderPublicKey);

        return Handlers.Registry.get(transaction.type, transaction.typeGroup).throwIfCannotBeApplied(
            transaction,
            sender,
            this.databaseService.walletManager,
        );
    }

    public async revertTransactionForSender(transaction: Interfaces.ITransaction): Promise<void> {
        return Handlers.Registry.get(transaction.type, transaction.typeGroup).revertForSender(transaction, this);
    }
}
