import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";

import { defaults } from "./defaults";

type CryptoPackagesConfig = typeof defaults.workerPool.cryptoPackages;

@Container.injectable()
export class WorkerPool implements Contracts.TransactionPool.WorkerPool {
    @Container.inject(Container.Identifiers.TransactionPoolWorkerFactory)
    private readonly createWorker!: Contracts.TransactionPool.WorkerFactory;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly pluginConfiguration!: Providers.PluginConfiguration;

    private workers: Contracts.TransactionPool.Worker[] = [];

    @Container.postConstruct()
    public initialize() {
        const workerCount: number = this.pluginConfiguration.getRequired("workerPool.workerCount");
        const cryptoPackages: CryptoPackagesConfig = this.pluginConfiguration.getRequired("workerPool.cryptoPackages");

        for (let i = 0; i < workerCount; i++) {
            const worker = this.createWorker();
            const availableCryptoPackages = cryptoPackages.filter((p) => require.resolve(p.packageName));
            for (const { packageName } of availableCryptoPackages) {
                worker.loadCryptoPackage(packageName);
            }
            this.workers.push(worker);
        }
    }

    public isTypeGroupSupported(typeGroup: Enums.TransactionTypeGroup): boolean {
        if (typeGroup === Enums.TransactionTypeGroup.Core) {
            return true;
        }

        const cryptoPackages: CryptoPackagesConfig = this.pluginConfiguration.getRequired("workerPool.cryptoPackages");
        return cryptoPackages.some((p) => p.typeGroup === typeGroup);
    }

    public async getTransactionFromData(
        transactionData: Interfaces.ITransactionData | Buffer,
    ): Promise<Interfaces.ITransaction> {
        const worker: Contracts.TransactionPool.Worker = this.workers.reduce((prev, next) => {
            if (prev.getQueueSize() < next.getQueueSize()) {
                return prev;
            } else {
                return next;
            }
        });

        return worker.getTransactionFromData(transactionData);
    }
}
