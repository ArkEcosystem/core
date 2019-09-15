import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import clonedeep from "lodash.clonedeep";

export class WalletManager extends Wallets.WalletManager {
    private readonly databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>(
        "database",
    );

    public constructor() {
        super();

        const indexes: string[] = this.databaseService.walletManager.getIndexNames();
        for (const index of indexes) {
            if (this.indexes[index]) {
                continue;
            }

            this.registerIndex(index, this.databaseService.walletManager.getIndex(index).indexer);
        }
    }

    public findByAddress(address: string): State.IWallet {
        if (address && !this.hasByAddress(address)) {
            this.reindex(clonedeep(this.databaseService.walletManager.findByAddress(address)));
        }

        return this.findByIndex(State.WalletIndexes.Addresses, address);
    }

    public forget(publicKey: string): void {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(Identities.Address.fromPublicKey(publicKey));
    }

    public async throwIfCannotBeApplied(transaction: Interfaces.ITransaction): Promise<void> {
        const sender: State.IWallet = this.findByPublicKey(transaction.data.senderPublicKey);
        const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
            transaction.type,
            transaction.typeGroup,
        );
        return handler.throwIfCannotBeApplied(transaction, sender, this.databaseService.walletManager);
    }

    public async revertTransactionForSender(transaction: Interfaces.ITransaction): Promise<void> {
        const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
            transaction.type,
            transaction.typeGroup,
        );
        return handler.revertForSender(transaction, this);
    }
}
