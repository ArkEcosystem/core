import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import camelCase from "lodash.camelcase";

/**
 * Calculate minimum fee of a transaction for entering the pool.
 */
export function calculateFee(satoshiPerByte: number, transaction: Interfaces.ITransaction): Utils.BigNumber {
    if (satoshiPerByte <= 0) {
        satoshiPerByte = 1;
    }

    let key;
    if (transaction.type in Enums.TransactionTypes) {
        key = camelCase(Enums.TransactionTypes[transaction.type]);
    } else {
        key = camelCase(transaction.constructor.name.replace("Transaction", ""));
    }

    const addonBytes = app.resolveOptions("transaction-pool").dynamicFees.addonBytes[key];

    // serialized is in hex
    const transactionSizeInBytes = transaction.serialized.length / 2;

    return Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
}

/**
 * Determine if a transaction's fee meets the minimum requirements for broadcasting
 * and for entering the transaction pool.
 * @param {Transaction} Transaction - transaction to check
 * @return {Object} { broadcast: Boolean, enterPool: Boolean }
 */
export function dynamicFeeMatcher(transaction: Interfaces.ITransaction): { broadcast: boolean; enterPool: boolean } {
    const logger = app.resolvePlugin<Logger.ILogger>("logger");

    const fee: Utils.BigNumber = transaction.data.fee;
    const id: string = transaction.id;

    const { dynamicFees } = app.resolveOptions("transaction-pool");

    let broadcast;
    let enterPool;

    if (dynamicFees.enabled) {
        const minFeeBroadcast = calculateFee(dynamicFees.minFeeBroadcast, transaction);

        if (fee.isGreaterThanOrEqualTo(minFeeBroadcast)) {
            broadcast = true;

            logger.debug(
                `Transaction ${id} eligible for broadcast - fee of ${Utils.formatSatoshi(fee)} is ${
                    fee.isEqualTo(minFeeBroadcast) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;

            logger.debug(
                `Transaction ${id} not eligible for broadcast - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool: Utils.BigNumber = calculateFee(dynamicFees.minFeePool, transaction);

        if (fee.isGreaterThanOrEqualTo(minFeePool)) {
            enterPool = true;

            logger.debug(
                `Transaction ${id} eligible to enter pool - fee of ${Utils.formatSatoshi(fee)} is ${
                    fee.isEqualTo(minFeePool) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;

            logger.debug(
                `Transaction ${id} not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        }
    } else {
        // Static fees
        const staticFee: Utils.BigNumber = Managers.feeManager.getForTransaction(transaction.data);

        if (fee.isEqualTo(staticFee)) {
            broadcast = true;
            enterPool = true;

            logger.debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is equal to static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;

            logger.debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} does not match static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
}
