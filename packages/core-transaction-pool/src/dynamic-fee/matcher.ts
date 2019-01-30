import { app } from "@arkecosystem/core-kernel";
import { constants, feeManager, formatArktoshi } from "@arkecosystem/crypto";
import camelCase from "lodash/camelCase";

/**
 * Calculate minimum fee of a transaction for entering the pool.
 * @param {Number} Minimum fee ARKTOSHI/byte
 * @param {Transaction} Transaction for which we calculate the fee
 * @returns {Number} Calculated minimum acceptable fee in ARKTOSHI
 */
export function calculateFee(arktoshiPerByte, transaction) {
    if (arktoshiPerByte <= 0) {
        arktoshiPerByte = 1;
    }

    const addonBytes = localConfig.get("dynamicFees.addonBytes")[
        camelCase(constants.TransactionTypes[transaction.type])
    ];

    // serialized is in hex
    const transactionSizeInBytes = transaction.serialized.length / 2;

    return (addonBytes + transactionSizeInBytes) * arktoshiPerByte;
}

/**
 * Determine if a transaction's fee meets the minimum requirements for broadcasting
 * and for entering the transaction pool.
 * @param {Transaction} Transaction - transaction to check
 * @return {Object} { broadcast: Boolean, enterPool: Boolean }
 */
export function dynamicFeeMatcher(transaction) {
    const fee = +transaction.fee.toFixed();
    const id = transaction.id;

    const dynamicFees = localConfig.get("dynamicFees");

    let broadcast;
    let enterPool;

    if (dynamicFees.enabled) {
        const minFeeBroadcast = calculateFee(dynamicFees.minFeeBroadcast, transaction);

        if (fee >= minFeeBroadcast) {
            broadcast = true;
            app.logger.debug(
                `Transaction ${id} eligible for broadcast - fee of ${formatArktoshi(fee)} is ${
                    fee === minFeeBroadcast ? "equal to" : "greater than"
                } minimum fee (${formatArktoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;
            app.logger.debug(
                `Transaction ${id} not eligible for broadcast - fee of ${formatArktoshi(
                    fee,
                )} is smaller than minimum fee (${formatArktoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool = calculateFee(dynamicFees.minFeePool, transaction);
        if (fee >= minFeePool) {
            enterPool = true;
            app.logger.debug(
                `Transaction ${id} eligible to enter pool - fee of ${formatArktoshi(fee)} is ${
                    fee === minFeePool ? "equal to" : "greater than"
                } minimum fee (${formatArktoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;
            app.logger.debug(
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
            app.logger.debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${formatArktoshi(
                    fee,
                )} is equal to static fee (${formatArktoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;
            app.logger.debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${formatArktoshi(
                    fee,
                )} does not match static fee (${formatArktoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
}
