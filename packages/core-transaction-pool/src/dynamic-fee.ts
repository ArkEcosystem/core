import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { DynamicFeeMatch } from "./interfaces";

// todo: review implementation and better method name that indicates what it does
export const dynamicFeeMatcher = async (
    app: Contracts.Kernel.Application,
    transaction: Interfaces.ITransaction,
): Promise<DynamicFeeMatch> => {
    AppUtils.assert.defined<string>(transaction.id);

    const fee: Utils.BigNumber = transaction.data.fee;
    const id: string = transaction.id;

    const dynamicFees: Record<string, any> | undefined = app
        .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
        .get("@arkecosystem/core-transaction-pool")
        .config()
        .get<Record<string, any>>("dynamicFees");

    const height: number = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastHeight();

    AppUtils.assert.defined<Record<string, any>>(dynamicFees);

    let broadcast: boolean;
    let enterPool: boolean;

    if (dynamicFees.enabled) {
        const handler: Handlers.TransactionHandler = await app
            .get<any>(Container.Identifiers.TransactionHandlerRegistry)
            .get(transaction.data);

        const addonBytes: number = dynamicFees.addonBytes[transaction.key];
        const minFeeBroadcast: Utils.BigNumber = handler.dynamicFee({
            transaction,
            addonBytes,
            satoshiPerByte: dynamicFees.minFeeBroadcast,
            height,
        });

        if (fee.isGreaterThanEqual(minFeeBroadcast)) {
            broadcast = true;

            app.log.debug(
                `Transaction ${id} eligible for broadcast - fee of ${Utils.formatSatoshi(fee)} is ${
                fee.isEqualTo(minFeeBroadcast) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        } else {
            broadcast = false;

            app.log.debug(
                `Transaction ${id} not eligible for broadcast - fee of ${Utils.formatSatoshi(
                    fee,
                )} is smaller than minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
        }

        const minFeePool: Utils.BigNumber = handler.dynamicFee({
            transaction,
            addonBytes,
            satoshiPerByte: dynamicFees.minFeePool,
            height,
        });

        if (fee.isGreaterThanEqual(minFeePool)) {
            enterPool = true;

            app.log.debug(
                `Transaction ${id} eligible to enter pool - fee of ${Utils.formatSatoshi(fee)} is ${
                fee.isEqualTo(minFeePool) ? "equal to" : "greater than"
                } minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
        } else {
            enterPool = false;

            app.log.debug(
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

            app.log.debug(
                `Transaction ${id} eligible for broadcast and to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} is equal to static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        } else {
            broadcast = false;
            enterPool = false;

            app.log.debug(
                `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${Utils.formatSatoshi(
                    fee,
                )} does not match static fee (${Utils.formatSatoshi(staticFee)})`,
            );
        }
    }

    return { broadcast, enterPool };
};
