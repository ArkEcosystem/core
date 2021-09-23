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
export declare const calculateTransactionExpiration: (transaction: Interfaces.ITransactionData, context: {
    blockTime: number;
    currentHeight: number;
    now: number;
    maxTransactionAge: number;
}) => number;
