import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { constants, feeManager, formatSatoshi } from "@arkecosystem/crypto";
import camelCase from "lodash/camelCase";
import { config as localConfig } from "../config";

/**
 * Calculate minimum fee of a transaction for entering the pool.
 * @param {Number} Minimum fee SATOSHI/byte
 * @param {Transaction} Transaction for which we calculate the fee
 * @returns {Number} Calculated minimum acceptable fee in SATOSHI
 */
export function calculateFee(satoshiPerByte, transaction) {
    if (satoshiPerByte <= 0) {
        satoshiPerByte = 1;
    }

    const addonBytes = localConfig.get("dynamicFees.addonBytes")[
        camelCase(constants.TransactionTypes[transaction.type])
    ];

    // serialized is in hex
    const transactionSizeInBytes = transaction.serialized.length / 2;

    return (addonBytes + transactionSizeInBytes) * satoshiPerByte;
}

/**
 * Determine if a transaction's fee meets the minimum requirements for broadcasting
 * and for entering the transaction pool.
 * @param {Transaction} Transaction - transaction to check
 * @return {Object} { broadcast: Boolean, enterPool: Boolean }
 */
export function dynamicFeeMatcher(transaction) {
    const logger = app.resolvePlugin<Logger.ILogger>("logger");

    const fee = +transaction.fee.toFixed();
    const id = transaction.id;

    const dynamicFees = localConfig.get("dynamicFees");

    let broadcast;
    let enterPool;

    if (dynamicFees.enabled) {
        const minFeeBroadcast = calculateFee(dynamicFees.minFeeBroadcast, transaction);

        if (fee >= minFeeBroadcast) {
            broadcast = true;
            logger.debug(
                `Transaction ${id} eligible for broadcast - fee of ${formatSatoshi(fee)} is ${
                    fee === minFeeBroadcast ? "equal to" : "greater than"
                } minimum fee (${formatSatoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;
            logger.debug(
                `Transaction ${id} not eligible for broadcast - fee of ${formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${formatSatoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool = calculateFee(dynamicFees.minFeePool, transaction);
        if (fee >= minFeePool) {
            enterPool = true;
            logger.debug(
                `Transaction ${id} eligible to enter pool - fee of ${formatSatoshi(fee)} is ${
                    fee === minFeePool ? "equal to" : "greater than"
                } minimum fee (${formatSatoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;
            logger.debug(
                `Transaction ${id} not eligible to enter pool - fee of ${formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${formatSatoshi(minFeePool)})`,
            );
        }
    } else {
        // Static fees
        const staticFee = feeManager.getForTransaction(transaction);

        if (fee === staticFee) {
            broadcast = true;
            enterPool = true;
            logger.debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${formatSatoshi(
                    fee,
                )} is equal to static fee (${formatSatoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;
            logger.debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${formatSatoshi(
                    fee,
                )} does not match static fee (${formatSatoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
}
