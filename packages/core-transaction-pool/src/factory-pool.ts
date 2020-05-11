import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class FactoryPool implements Contracts.TransactionPool.FactoryPool {
    @Container.inject(Container.Identifiers.TransactionPoolFactoryWorkerFactory)
    private readonly createFactoryWorker!: Contracts.TransactionPool.FactoryWorkerFactory;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly pluginConfiguration!: Providers.PluginConfiguration;

    private workers: Contracts.TransactionPool.FactoryWorker[] = [];

    @Container.postConstruct()
    public initialize() {
        const workerCount: number = this.pluginConfiguration.getRequired<number>("factoryPool.workerCount");
        for (let i = 0; i < workerCount; i++) {
            const worker = this.createFactoryWorker();
            this.workers.push(worker);
        }
    }

    public isTypeGroupSupported(typeGroup: Enums.TransactionTypeGroup): boolean {
        if (typeGroup === Enums.TransactionTypeGroup.Core) {
            return true;
        }

        return !!this.pluginConfiguration
            .getRequired<{ typeGroup: number }[]>("factoryPool.cryptoPackages")
            .find((p) => p.typeGroup === typeGroup);
    }

    public async getTransactionFromData(
        transactionData: Interfaces.ITransactionData,
    ): Promise<Interfaces.ITransaction> {
        const worker: Contracts.TransactionPool.FactoryWorker = this.workers.reduce((prev, next) => {
            if (prev.getQueueSize() < next.getQueueSize()) {
                return prev;
            } else {
                return next;
            }
        });

        return worker.getTransactionFromData(transactionData);
    }
}
