import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class Mempool implements Contracts.TransactionPool.Mempool {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.TransactionPoolMempoolIndexRegistry)
    private readonly mempoolIndexRegistry!: Contracts.TransactionPool.MempoolIndexRegistry;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.TransactionPoolSenderMempoolFactory)
    private readonly createSenderMempool!: Contracts.TransactionPool.SenderMempoolFactory;

    private readonly senderMempools = new Map<string, Contracts.TransactionPool.SenderMempool>();

    public getSize(): number {
        return Array.from(this.senderMempools.values()).reduce((sum, p) => sum + p.getSize(), 0);
    }

    public hasSenderMempool(senderPublicKey: string): boolean {
        return this.senderMempools.has(senderPublicKey);
    }

    public getSenderMempool(senderPublicKey: string): Contracts.TransactionPool.SenderMempool {
        const senderMempool = this.senderMempools.get(senderPublicKey);
        if (!senderMempool) {
            throw new Error("Unknown sender");
        }
        return senderMempool;
    }

    public getSenderMempools(): Iterable<Contracts.TransactionPool.SenderMempool> {
        return this.senderMempools.values();
    }

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        let senderMempool = this.senderMempools.get(transaction.data.senderPublicKey);
        if (!senderMempool) {
            senderMempool = this.createSenderMempool();
            this.senderMempools.set(transaction.data.senderPublicKey, senderMempool);
            this.logger.debug(`${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} state created`);
        }

        try {
            await senderMempool.addTransaction(transaction);
        } finally {
            this.removeDisposableMempool(transaction.data.senderPublicKey);
        }
    }

    public async removeTransaction(senderPublicKey: string, id: string): Promise<Interfaces.ITransaction[]> {
        const senderMempool = this.senderMempools.get(senderPublicKey);
        if (!senderMempool) {
            return [];
        }

        try {
            return await senderMempool.removeTransaction(id);
        } finally {
            this.removeDisposableMempool(senderPublicKey);
        }
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<Interfaces.ITransaction[]> {
        const sendersForReadd: Set<string> = new Set();

        const handlerRegistry = this.app.getTagged<Handlers.Registry>(
            Container.Identifiers.TransactionHandlerRegistry,
            "state",
            "copy-on-write",
        );

        for (const transaction of block.transactions) {
            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            const handler: Handlers.TransactionHandler = await handlerRegistry.getActivatedHandlerForData(
                transaction.data,
            );

            const senderMempool = this.senderMempools.get(transaction.data.senderPublicKey);
            if (senderMempool) {
                if (await senderMempool.removeForgedTransaction(transaction.id)) {
                    await handler.onPoolLeave(transaction);
                    this.logger.debug(`Removed forged ${transaction}`);
                    this.removeDisposableMempool(transaction.data.senderPublicKey);
                } else {
                    sendersForReadd.add(transaction.data.senderPublicKey);
                }
            }

            for (const invalidTransaction of await handler.getInvalidPoolTransactions(transaction)) {
                AppUtils.assert.defined<string>(invalidTransaction.data.senderPublicKey);
                sendersForReadd.add(invalidTransaction.data.senderPublicKey);
            }
        }

        const removedTransactions: Interfaces.ITransaction[] = [];

        for (const senderPublicKey of sendersForReadd.keys()) {
            const senderMempool = this.getSenderMempool(senderPublicKey);

            for (const transaction of senderMempool.getFromLatest()) {
                const handler: Handlers.TransactionHandler = await handlerRegistry.getActivatedHandlerForData(
                    transaction.data,
                );
                await handler.onPoolLeave(transaction);
            }

            const newSenderMempool = this.createSenderMempool();

            const transactionsForReadd = [...senderMempool.getFromEarliest()];

            for (let i = 0; i < transactionsForReadd.length; i++) {
                const transaction = transactionsForReadd[i];

                try {
                    await newSenderMempool.addTransaction(transaction);
                } catch {
                    transactionsForReadd.slice(i).map((tx) => {
                        removedTransactions.push(tx);
                        this.logger.debug(`Removed invalid ${transaction}`);
                    });
                    break;
                }
            }

            this.senderMempools.delete(senderPublicKey);
            if (newSenderMempool.getSize()) {
                this.senderMempools.set(senderPublicKey, newSenderMempool);
            }
        }

        return removedTransactions;
    }

    public flush(): void {
        this.senderMempools.clear();
        this.mempoolIndexRegistry.clear();
    }

    private removeDisposableMempool(senderPublicKey: string): void {
        const senderMempool = this.senderMempools.get(senderPublicKey);

        if (senderMempool && senderMempool.isDisposable()) {
            this.senderMempools.delete(senderPublicKey);
            this.logger.debug(`${Identities.Address.fromPublicKey(senderPublicKey)} state disposed`);
        }
    }
}
