import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

@Container.injectable()
export class ExpirationService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public getTransactionExpirationHeight(transaction: Interfaces.ITransaction): number | undefined {
        if (transaction.data.version && transaction.data.version >= 2) {
            return transaction.data.expiration;
        } else {
            const currentHeight: number = this.stateStore.getLastHeight();
            const blockTime: number = Managers.configManager.getMilestone(currentHeight).blocktime;
            const createdSecondsAgo: number = Crypto.Slots.getTime() - transaction.data.timestamp;
            const createdBlocksAgo: number = Math.floor(createdSecondsAgo / blockTime); // ! varying block times
            const maxTransactionAge: number = this.configuration.getRequired<number>("maxTransactionAge");

            return currentHeight - createdBlocksAgo + maxTransactionAge;
        }
    }

    public isTransactionExpired(transaction: Interfaces.ITransaction): boolean {
        const expirationHeight = this.getTransactionExpirationHeight(transaction);
        if (!expirationHeight) {
            return false;
        }
        return expirationHeight <= this.stateStore.getLastHeight() + 1;
    }
}
