import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { TransactionFeeToHighError, TransactionFeeToLowError } from "./errors";

@Container.injectable()
export class DynamicFeeMatcher implements Contracts.TransactionPool.DynamicFeeMatcher {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "blockchain")
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        const dynamicFeesConfiguration: Record<string, any> = this.configuration.getRequired<Record<string, any>>(
            "dynamicFees",
        );
        const feeStr = Utils.formatSatoshi(transaction.data.fee);

        if (dynamicFeesConfiguration.enabled) {
            const addonBytes: number = dynamicFeesConfiguration.addonBytes[transaction.key];
            const height: number = this.stateStore.getLastHeight();
            const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

            const minFeePool: Utils.BigNumber = handler.dynamicFee({
                transaction,
                addonBytes,
                satoshiPerByte: dynamicFeesConfiguration.minFeePool,
                height,
            });
            const minFeeStr = Utils.formatSatoshi(minFeePool);

            if (transaction.data.fee.isGreaterThanEqual(minFeePool)) {
                this.logger.debug(`${transaction} eligible to enter pool (fee ${feeStr} >= ${minFeeStr})`);
                return;
            }

            this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeStr} < ${minFeeStr})`);
            throw new TransactionFeeToLowError(transaction);
        } else {
            const staticFeeStr = Utils.formatSatoshi(transaction.staticFee);

            if (transaction.data.fee.isEqualTo(transaction.staticFee)) {
                this.logger.debug(`${transaction} eligible to enter pool (fee ${feeStr} = ${staticFeeStr})`);
                return;
            }
            if (transaction.data.fee.isLessThan(transaction.staticFee)) {
                this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeStr} < ${staticFeeStr})`);
                throw new TransactionFeeToLowError(transaction);
            }

            this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeStr} > ${staticFeeStr})`);
            throw new TransactionFeeToHighError(transaction);
        }
    }

    public async throwIfCannotBroadcast(transaction: Interfaces.ITransaction): Promise<void> {
        const dynamicFeesConfiguration: Record<string, any> = this.configuration.getRequired<Record<string, any>>(
            "dynamicFees",
        );
        const feeStr = Utils.formatSatoshi(transaction.data.fee);

        if (dynamicFeesConfiguration.enabled) {
            const addonBytes: number = dynamicFeesConfiguration.addonBytes[transaction.key];
            const height: number = this.stateStore.getLastHeight();
            const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

            const minFeeBroadcast: Utils.BigNumber = handler.dynamicFee({
                transaction,
                addonBytes,
                satoshiPerByte: dynamicFeesConfiguration.minFeeBroadcast,
                height,
            });
            const minFeeStr = Utils.formatSatoshi(minFeeBroadcast);

            if (transaction.data.fee.isGreaterThanEqual(minFeeBroadcast)) {
                this.logger.debug(`${transaction} eligible for broadcast (fee ${feeStr} >= ${minFeeStr})`);
                return;
            }

            this.logger.notice(`${transaction} not eligible for broadcast (fee ${feeStr} < ${minFeeStr})`);
            throw new TransactionFeeToLowError(transaction);
        } else {
            const staticFeeStr = Utils.formatSatoshi(transaction.staticFee);

            if (transaction.data.fee.isEqualTo(transaction.staticFee)) {
                this.logger.debug(`${transaction} eligible for broadcast (fee ${feeStr} = ${staticFeeStr})`);
                return;
            }
            if (transaction.data.fee.isLessThan(transaction.staticFee)) {
                this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeStr} < ${staticFeeStr})`);
                throw new TransactionFeeToLowError(transaction);
            }

            this.logger.notice(`${transaction} not eligible to enter pool (fee ${feeStr} > ${staticFeeStr})`);
            throw new TransactionFeeToHighError(transaction);
        }
    }
}
