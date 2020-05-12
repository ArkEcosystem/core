import { CryptoManager } from "@arkecosystem/core-crypto";
import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class ExpirationService {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoManager;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public canExpire(transaction: Interfaces.ITransaction): boolean {
        if (transaction.data.version && transaction.data.version >= 2) {
            return !!transaction.data.expiration;
        } else {
            return true;
        }
    }

    public isExpired(transaction: Interfaces.ITransaction): boolean {
        if (this.canExpire(transaction)) {
            return this.getExpirationHeight(transaction) <= this.stateStore.getLastHeight() + 1;
        } else {
            return false;
        }
    }

    public getExpirationHeight(transaction: Interfaces.ITransaction): number {
        if (transaction.data.version && transaction.data.version >= 2) {
            AppUtils.assert.defined<number>(transaction.data.expiration);
            return transaction.data.expiration;
        } else {
            const currentHeight: number = this.stateStore.getLastHeight();
            const blockTime: number = this.cryptoManager.MilestoneManager.getMilestone(currentHeight).blocktime;
            const createdSecondsAgo: number =
                this.cryptoManager.LibraryManager.Crypto.Slots.getTime() - transaction.data.timestamp;
            const createdBlocksAgo: number = Math.floor(createdSecondsAgo / blockTime); // ! varying block times
            const maxTransactionAge: number = this.configuration.getRequired<number>("maxTransactionAge");

            return currentHeight - createdBlocksAgo + maxTransactionAge;
        }
    }
}
