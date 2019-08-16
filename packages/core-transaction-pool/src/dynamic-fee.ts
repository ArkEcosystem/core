import { app, Contracts } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { IDynamicFeeMatch } from "./interfaces";

// @TODO: better name
export const dynamicFeeMatcher = (transaction: Interfaces.ITransaction): IDynamicFeeMatch => {
    const fee: Utils.BigNumber = transaction.data.fee;
    const id: string = transaction.id;

    const { dynamicFees } = app.resolve("transaction-pool.options");

    let broadcast: boolean;
    let enterPool: boolean;

    if (dynamicFees.enabled) {
        const handler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type, transaction.typeGroup);
        const addonBytes: number = app.resolve("transaction-pool.options").dynamicFees.addonBytes[transaction.key];
        const minFeeBroadcast: Utils.BigNumber = handler.dynamicFee(
            transaction,
            addonBytes,
            dynamicFees.minFeeBroadcast,
        );

        if (fee.isGreaterThanOrEqualTo(minFeeBroadcast)) {
            broadcast = true;

            app.resolve<Contracts.Kernel.ILogger>("logger").debug(
                `Transaction ${id} eligible for broadcast - fee of ${Utils.formatSatoshi(fee)} is ${
                    fee.isEqualTo(minFeeBroadcast) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;

            app.resolve<Contracts.Kernel.ILogger>("logger").debug(
                `Transaction ${id} not eligible for broadcast - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool: Utils.BigNumber = handler.dynamicFee(transaction, addonBytes, dynamicFees.minFeePool);

        if (fee.isGreaterThanOrEqualTo(minFeePool)) {
            enterPool = true;

            app.resolve<Contracts.Kernel.ILogger>("logger").debug(
                `Transaction ${id} eligible to enter pool - fee of ${Utils.formatSatoshi(fee)} is ${
                    fee.isEqualTo(minFeePool) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;

            app.resolve<Contracts.Kernel.ILogger>("logger").debug(
                `Transaction ${id} not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        }
    } else {
        const staticFee: Utils.BigNumber = transaction.staticFee;
        if (fee.isEqualTo(staticFee)) {
            broadcast = true;
            enterPool = true;

            app.resolve<Contracts.Kernel.ILogger>("logger").debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is equal to static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;

            app.resolve<Contracts.Kernel.ILogger>("logger").debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} does not match static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
};
