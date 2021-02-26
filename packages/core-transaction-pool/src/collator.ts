import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";

@Container.injectable()
export class Collator implements Contracts.TransactionPool.Collator {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionValidatorFactory)
    private readonly createTransactionValidator!: Contracts.State.TransactionValidatorFactory;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly pool!: Contracts.TransactionPool.Service;

    @Container.inject(Container.Identifiers.TransactionPoolExpirationService)
    private readonly expirationService!: Contracts.TransactionPool.ExpirationService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async getBlockCandidateTransactions(): Promise<Interfaces.ITransaction[]> {
        let bytesLeft: number | undefined = this.configuration.get<number>("maxTransactionBytes");
        let bytesLeftNext: number | undefined;

        const height: number = this.blockchain.getLastBlock().data.height;
        const milestone = Managers.configManager.getMilestone(height);
        const candidateTransactions: Interfaces.ITransaction[] = [];
        const validator: Contracts.State.TransactionValidator = this.createTransactionValidator();
        const failedTransactions: Interfaces.ITransaction[] = [];

        for (const transaction of this.poolQuery.getFromHighestPriority()) {
            if (candidateTransactions.length === milestone.block.maxTransactions) {
                break;
            }

            if (failedTransactions.some((t) => t.data.senderPublicKey === transaction.data.senderPublicKey)) {
                continue;
            }

            if (await this.expirationService.isExpired(transaction)) {
                failedTransactions.push(transaction);
                continue;
            }

            if (bytesLeft !== undefined) {
                bytesLeftNext = bytesLeft - JSON.stringify(transaction.data).length;

                if (bytesLeftNext < 0) {
                    break;
                }
            }

            try {
                await validator.validate(transaction);
                candidateTransactions.push(transaction);
                bytesLeft = bytesLeftNext;
            } catch (error) {
                this.logger.warning(`${transaction} failed to collate: ${error.message}`);
                failedTransactions.push(transaction);
            }
        }

        (async () => {
            for (const failedTransaction of failedTransactions) {
                await this.pool.removeTransaction(failedTransaction);
            }
        })();

        return candidateTransactions;
    }
}
