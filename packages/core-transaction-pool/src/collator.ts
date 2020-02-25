import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";

import { Connection } from "./connection";
import { Memory } from "./memory";

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
    private readonly pool!: Connection;

    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Memory;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async getBlockCandidateTransactions(): Promise<Interfaces.ITransaction[]> {
        let bytesLeft: number | undefined = this.configuration.get<number>("maxTransactionBytes");

        const height: number = this.blockchain.getLastBlock().data.height;
        const milestone = Managers.configManager.getMilestone(height);
        const transactions: Interfaces.ITransaction[] = [];
        const validator: Contracts.State.TransactionValidator = this.createTransactionValidator();

        for (const transaction of this.memory.allSortedByFee().slice()) {
            if (transactions.length === milestone.block.maxTransactions) {
                break;
            }

            if (bytesLeft !== undefined) {
                bytesLeft -= JSON.stringify(transaction.data).length;
                if (bytesLeft < 0) {
                    break;
                }
            }

            try {
                await validator.validate(transaction);
                transactions.push(transaction);
            } catch (error) {
                this.pool.removeTransactionById(transaction.id!);
                this.logger.error(
                    `[Pool] Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`,
                );
            }
        }

        return transactions;
    }
}
