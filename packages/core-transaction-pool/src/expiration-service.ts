import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

@Container.injectable()
export class ExpirationService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public getTransactionExpiredBlocksCount(transaction: Interfaces.ITransaction): number {
        const maxTransactionAge = this.configuration.getRequired<number>("maxTransactionAge");
        const currentHeight = this.stateStore.getLastHeight();
        const nextHeight = currentHeight + 1;

        if (transaction.data.version && transaction.data.version >= 2) {
            if (transaction.data.expiration) {
                return Math.max(nextHeight - transaction.data.expiration + 1, 0);
            } else {
                return 0;
            }
        }

        const blockTime = Managers.configManager.getMilestone(currentHeight).blocktime;
        const createdSecondsAgo = Crypto.Slots.getTime() - transaction.data.timestamp;
        const createdBlocksAgo = Math.floor(createdSecondsAgo / blockTime); // ! varying block times

        return Math.max(createdBlocksAgo - maxTransactionAge + 1, 0);
    }

    public isTransactionExpired(transaction: Interfaces.ITransaction): boolean {
        return this.getTransactionExpiredBlocksCount(transaction) !== 0;
    }
}
