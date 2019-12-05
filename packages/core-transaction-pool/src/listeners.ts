import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Cleaner } from "./cleaner";

/**
 * @class PurgeInvalidTransactions
 * @implements {EventListener}
 */
@Container.injectable()
export class PurgeInvalidTransactions implements Contracts.Kernel.EventListener {
    /**
     * @private
     * @type {Cleaner}
     * @memberof PurgeInvalidTransactions
     */
    @Container.inject(Container.Identifiers.TransactionPoolCleaner)
    private readonly cleaner!: Cleaner;

    /**
     * @returns {Promise<void>}
     * @memberof PurgeInvalidTransactions
     */
    public async handle(): Promise<void> {
        await this.cleaner.purgeInvalidTransactions();
    }
}
