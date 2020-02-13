import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class Memory implements Contracts.TransactionPool.Memory {
    @Container.inject(Container.Identifiers.TransactionPoolSenderStateFactory)
    private readonly createSenderState!: Contracts.TransactionPool.SenderStateFactory;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private readonly senderStates = new Map<string, Contracts.TransactionPool.SenderState>();

    public get size(): number {
        return Array.from(this.senderStates.values()).reduce((sum, p) => sum + p.size, 0);
    }

    public clear(): void {
        this.senderStates.clear();
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

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        let senderState = this.senderStates.get(transaction.data.senderPublicKey);
        if (!senderState) {
            senderState = this.createSenderState();
            this.senderStates.set(transaction.data.senderPublicKey, senderState);
            this.logger.info(`Mempool ${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} created`);
        }

        try {
            await senderState.apply(transaction);
        } finally {
            if (senderState.size === 0) {
                this.senderStates.delete(transaction.data.senderPublicKey);
                this.logger.info(
                    `Mempool ${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`,
                );
            }
        }
    }

    public async remove(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderState = this.senderStates.get(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Contracts.TransactionPool.SenderState>(senderState);

        try {
            const removedTransactions = await senderState.remove(transaction);
            if (senderState.size === 0) {
                this.senderStates.delete(transaction.data.senderPublicKey);
                this.logger.info(
                    `Mempool ${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`,
                );
            }
            return removedTransactions;
        } catch (error) {
            const removedTransactions = Array.from(senderState.getFromEarliestNonce());
            this.senderStates.delete(transaction.data.senderPublicKey);
            this.logger.info(`Mempool ${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`);
            return removedTransactions;
        }
    }

    public accept(transaction: Interfaces.ITransaction): Interfaces.ITransaction[] {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderState = this.senderStates.get(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Contracts.TransactionPool.SenderState>(senderState);

        try {
            return senderState.accept(transaction);
        } finally {
            if (senderState.size === 0) {
                this.senderStates.delete(transaction.data.senderPublicKey);
                this.logger.info(
                    `Mempool ${Identities.Address.fromPublicKey(transaction.data.senderPublicKey)} forgotten`,
                );
            }
        }
    }
}
