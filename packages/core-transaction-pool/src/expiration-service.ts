import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class ExpirationService implements Contracts.TransactionPool.ExpirationService {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

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

    public async isExpired(transaction: Interfaces.ITransaction): Promise<boolean> {
        if (this.canExpire(transaction)) {
            return (await this.getExpirationHeight(transaction)) <= this.stateStore.getLastHeight() + 1;
        } else {
            return false;
        }
    }

    public async getExpirationHeight(transaction: Interfaces.ITransaction): Promise<number> {
        if (transaction.data.version && transaction.data.version >= 2) {
            AppUtils.assert.defined<number>(transaction.data.expiration);
            return transaction.data.expiration;
        } else {
            // ! dynamic block time wasn't available during v1 times
            const currentHeight: number = this.stateStore.getLastHeight();
            const blockTimeLookup = await AppUtils.forgingInfoCalculator.getBlockTimeLookup(this.app, currentHeight);

            const createdSecondsAgo: number = Crypto.Slots.getTime() - transaction.data.timestamp;
            const createdBlocksAgo: number = Crypto.Slots.getSlotNumber(blockTimeLookup, createdSecondsAgo);
            const maxTransactionAge: number = this.configuration.getRequired<number>("maxTransactionAge");

            return Math.floor(currentHeight - createdBlocksAgo + maxTransactionAge);
        }
    }
}
