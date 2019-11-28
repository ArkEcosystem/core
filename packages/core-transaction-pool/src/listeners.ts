import { Contracts } from "@arkecosystem/core-kernel";

/**
 * @class PurgeInvalidTransactions
 * @implements {EventListener}
 */
export class PurgeInvalidTransactions implements Contracts.Kernel.EventListener {
    /**
     * @param {Contracts.TransactionPool.Connection} pool
     * @memberof PurgeInvalidTransactions
     */
    // todo: inject
    public constructor(private readonly pool: Contracts.TransactionPool.Connection) {}

    /**
     * @returns {Promise<void>}
     * @memberof PurgeInvalidTransactions
     */
    public async handle(): Promise<void> {
        // @ts-ignore - the interface is outdated
        await this.pool.purgeInvalidTransactions();
    }
}
