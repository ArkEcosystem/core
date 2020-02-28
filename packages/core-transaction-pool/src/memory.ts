import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class Memory implements Contracts.TransactionPool.Memory {
    @Container.inject(Container.Identifiers.TransactionPoolSenderStateFactory)
    private readonly createSenderState!: Contracts.TransactionPool.SenderStateFactory;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private readonly senderStates = new Map<string, Contracts.TransactionPool.SenderState>();

    public getSize(): number {
        return Array.from(this.senderStates.values()).reduce((sum, p) => sum + p.getTransactionsCount(), 0);
    }

    public hasSenderState(senderPublicKey: string): boolean {
        return this.senderStates.has(senderPublicKey);
    }

    public getSenderState(senderPublicKey: string): Contracts.TransactionPool.SenderState {
        const senderState = this.senderStates.get(senderPublicKey);
        if (!senderState) {
            throw new Error("Unknown sender");
        }
        return senderState;
    }

    public getSenderStates(): Iterable<Contracts.TransactionPool.SenderState> {
        return this.senderStates.values();
    }

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        let senderState = this.senderStates.get(transaction.data.senderPublicKey);
        if (!senderState) {
            senderState = this.createSenderState();
            this.senderStates.set(transaction.data.senderPublicKey, senderState);
            this.logger.debug(`${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} state created`);
        }

        try {
            await senderState.addTransaction(transaction);
        } finally {
            if (senderState.getTransactionsCount() === 0) {
                this.senderStates.delete(transaction.data.senderPublicKey);
                this.logger.debug(`${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`);
            }
        }
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderState = this.senderStates.get(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Contracts.TransactionPool.SenderState>(senderState);

        try {
            const removedTransactions = await senderState.removeTransaction(transaction);
            if (senderState.getTransactionsCount() === 0) {
                this.senderStates.delete(transaction.data.senderPublicKey);
                this.logger.debug(`${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`);
            }
            return removedTransactions;
        } catch (error) {
            const removedTransactions = Array.from(senderState.getTransactionsFromEarliestNonce());
            this.senderStates.delete(transaction.data.senderPublicKey);
            this.logger.debug(`${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`);
            return removedTransactions;
        }
    }

    public acceptForgedTransaction(transaction: Interfaces.ITransaction): Interfaces.ITransaction[] {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderState = this.senderStates.get(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Contracts.TransactionPool.SenderState>(senderState);

        try {
            return senderState.acceptForgedTransaction(transaction);
        } finally {
            if (senderState.getTransactionsCount() === 0) {
                this.senderStates.delete(transaction.data.senderPublicKey);
                this.logger.debug(`${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`);
            }
        }
    }

    public flush(): void {
        this.senderStates.clear();
    }
}
