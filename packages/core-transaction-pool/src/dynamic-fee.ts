import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import camelCase from "lodash.camelcase";
import { IDynamicFeeMatch } from "./interfaces";

export const calculateMinimumFee = (satoshiPerByte: number, transaction: Interfaces.ITransaction): Utils.BigNumber => {
    if (satoshiPerByte <= 0) {
        satoshiPerByte = 1;
    }

    const key: string = camelCase(
        transaction.type in Enums.TransactionTypes
            ? Enums.TransactionTypes[transaction.type]
            : transaction.constructor.name.replace("Transaction", ""),
    );

    const addonBytes: number = app.resolveOptions("transaction-pool").dynamicFees.addonBytes[key];
    const transactionSizeInBytes: number = transaction.serialized.length / 2;

    return Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
};

// @TODO: better name
export const dynamicFeeMatcher = (transaction: Interfaces.ITransaction): IDynamicFeeMatch => {
    const fee: Utils.BigNumber = transaction.data.fee;
    const id: string = transaction.id;

    const { dynamicFees } = app.resolveOptions("transaction-pool");

    let broadcast: boolean;
    let enterPool: boolean;

    if (dynamicFees.enabled) {
        const minFeeBroadcast: Utils.BigNumber = calculateMinimumFee(dynamicFees.minFeeBroadcast, transaction);

        if (fee.isGreaterThanOrEqualTo(minFeeBroadcast)) {
            broadcast = true;

            app.resolvePlugin<Logger.ILogger>("logger").debug(
                `Transaction ${id} eligible for broadcast - fee of ${Utils.formatSatoshi(fee)} is ${
                    fee.isEqualTo(minFeeBroadcast) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;

            app.resolvePlugin<Logger.ILogger>("logger").debug(
                `Transaction ${id} not eligible for broadcast - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool: Utils.BigNumber = calculateMinimumFee(dynamicFees.minFeePool, transaction);

        if (fee.isGreaterThanOrEqualTo(minFeePool)) {
            enterPool = true;

            app.resolvePlugin<Logger.ILogger>("logger").debug(
                `Transaction ${id} eligible to enter pool - fee of ${Utils.formatSatoshi(fee)} is ${
                    fee.isEqualTo(minFeePool) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;

            app.resolvePlugin<Logger.ILogger>("logger").debug(
                `Transaction ${id} not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        }
    } else {
        const staticFee: Utils.BigNumber = transaction.staticFee();

        if (fee.isEqualTo(staticFee)) {
            broadcast = true;
            enterPool = true;

            app.resolvePlugin<Logger.ILogger>("logger").debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is equal to static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;

            app.resolvePlugin<Logger.ILogger>("logger").debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} does not match static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
};
