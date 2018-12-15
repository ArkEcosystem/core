import { app } from "@arkecosystem/core-container";
import { configManager, dynamicFeeManager, feeManager, formatArktoshi } from "@arkecosystem/crypto";

/**
 * Determine if a transaction's fee meets the minimum requirements for broadcasting
 * and for entering the transaction pool.
 * @param {Transaction} Transaction - transaction to check
 * @return {Object} { broadcast: Boolean, enterPool: Boolean }
 */
export function dynamicFeeMatcher(transaction) {
    const logger = app.resolvePlugin("logger");

    const fee = +transaction.fee.toFixed();
    const id = transaction.id;

    const blockchain = app.resolvePlugin("blockchain");
    const dynamicFees = configManager.get("dynamicFees");

    let broadcast;
    let enterPool;

    if (dynamicFees.enabled) {
        const minFeeBroadcast = dynamicFeeManager.calculateFee(dynamicFees.minFeeBroadcast, transaction);
        if (fee >= minFeeBroadcast) {
            broadcast = true;
            logger.debug(
                `Transaction ${id} eligible for broadcast - fee of ${formatArktoshi(fee)} is ${
                    fee === minFeeBroadcast ? "equal to" : "greater than"
                } minimum fee (${formatArktoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;
            logger.debug(
                `Transaction ${id} not eligible for broadcast - fee of ${formatArktoshi(
                    fee,
                )} is smaller than minimum fee (${formatArktoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool = dynamicFeeManager.calculateFee(dynamicFees.minFeePool, transaction);
        if (fee >= minFeePool) {
            enterPool = true;
            logger.debug(
                `Transaction ${id} eligible to enter pool - fee of ${formatArktoshi(fee)} is ${
                    fee === minFeePool ? "equal to" : "greater than"
                } minimum fee (${formatArktoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;
            logger.debug(
                `Transaction ${id} not eligible to enter pool - fee of ${formatArktoshi(
                    fee,
                )} is smaller than minimum fee (${formatArktoshi(minFeePool)})`,
            );
        }
    } else {
        // Static fees
        const staticFee = feeManager.getForTransaction(transaction);

        if (fee === staticFee) {
            broadcast = true;
            enterPool = true;
            logger.debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${formatArktoshi(
                    fee,
                )} is equal to static fee (${formatArktoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;
            logger.debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${formatArktoshi(
                    fee,
                )} does not match static fee (${formatArktoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
}
