import { Interfaces } from "@arkecosystem/crypto";

/**
 * Calculate the expiration height of a transaction.
 * An expiration height H means that the transaction cannot be included in block at height
 * H or any higher block.
 * If the user did not specify an expiration height when creating the transaction then
 * we calculate one from the timestamp of the transaction creation and the configured
 * maximum transaction age (for v1 transactions). v2 transactions have a dedicated
 * expiration property.
 * @return number expiration height or null if the transaction does not expire
 */
export const calculateTransactionExpiration = (
    transaction: Interfaces.ITransactionData,
    context: {
        blockTime: number;
        currentHeight: number;
        now: number;
        maxTransactionAge: number;
    },
): number => {
    // We ignore transaction.expiration in v1 transactions because it is not signed
    // by the transaction creator.
    // TODO: check if ok
    if (transaction.version >= 2) {
        // tslint:disable-next-line:no-null-keyword
        return transaction.expiration || null;
    }

    // Since the user did not specify an expiration we set one by calculating
    // approximately the height of the chain as of the time the transaction was
    // created and adding maxTransactionAge to that.

    // Both now and transaction.timestamp use [number of seconds since the genesis block].
    const createdSecondsAgo: number = context.now - transaction.timestamp;

    const createdBlocksAgo: number = Math.floor(createdSecondsAgo / context.blockTime);

    const createdAtHeight: number = context.currentHeight - createdBlocksAgo;

    return createdAtHeight + context.maxTransactionAge;
}
