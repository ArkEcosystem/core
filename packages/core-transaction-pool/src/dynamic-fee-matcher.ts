import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

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

    public async canEnterPool(transaction: Interfaces.ITransaction): Promise<boolean> {
        const dynamicFeesConfiguration: Record<string, any> = this.configuration.getRequired<Record<string, any>>(
            "dynamicFees",
        );

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

            if (transaction.data.fee.isGreaterThan(minFeePool)) {
                this.logger.debug(
                    `Transaction ${transaction.id} eligible to enter pool - ` +
                        `fee of ${Utils.formatSatoshi(transaction.data.fee)} is greater than ` +
                        `minimum fee (${Utils.formatSatoshi(minFeePool)})`,
                );
                return true;
            }

            if (transaction.data.fee.isEqualTo(minFeePool)) {
                this.logger.debug(
                    `Transaction ${transaction.id} eligible to enter pool - ` +
                        `fee of ${Utils.formatSatoshi(transaction.data.fee)} is equal to ` +
                        `minimum fee (${Utils.formatSatoshi(minFeePool)})`,
                );
                return true;
            }

            this.logger.debug(
                `Transaction ${transaction.id} not eligible to enter pool - ` +
                    `fee of ${Utils.formatSatoshi(transaction.data.fee)} is smaller than ` +
                    `minimum fee (${Utils.formatSatoshi(minFeePool)})`,
            );
            return false;
        } else {
            if (transaction.data.fee.isEqualTo(transaction.staticFee)) {
                this.logger.debug(
                    `Transaction ${transaction.id} eligible to enter pool - ` +
                        `fee of ${Utils.formatSatoshi(transaction.data.fee)} is equal to ` +
                        `static fee (${Utils.formatSatoshi(transaction.staticFee)})`,
                );
                return true;
            }

            this.logger.debug(
                `Transaction ${transaction.id} not eligible to enter pool - ` +
                    `fee of ${Utils.formatSatoshi(transaction.data.fee)} does not match ` +
                    `static fee (${Utils.formatSatoshi(transaction.staticFee)})`,
            );
            return false;
        }
    }

    public async canBroadcast(transaction: Interfaces.ITransaction): Promise<boolean> {
        const dynamicFeesConfiguration: Record<string, any> = this.configuration.getRequired<Record<string, any>>(
            "dynamicFees",
        );

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

            if (transaction.data.fee.isGreaterThan(minFeeBroadcast)) {
                this.logger.debug(
                    `Transaction ${transaction.id} eligible for broadcast - ` +
                        `fee of ${Utils.formatSatoshi(transaction.data.fee)} is greater than ` +
                        `minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
                );
                return true;
            }

            if (transaction.data.fee.isEqualTo(minFeeBroadcast)) {
                this.logger.debug(
                    `Transaction ${transaction.id} eligible for broadcast - ` +
                        `fee of ${Utils.formatSatoshi(transaction.data.fee)} is equal to ` +
                        `minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
                );
                return true;
            }

            this.logger.debug(
                `Transaction ${transaction.id} not eligible for broadcast - ` +
                    `fee of ${Utils.formatSatoshi(transaction.data.fee)} is smaller than ` +
                    `minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
            );
            return false;
        } else {
            if (transaction.data.fee.isEqualTo(transaction.staticFee)) {
                this.logger.debug(
                    `Transaction ${transaction.id} eligible for broadcast - ` +
                        `fee of ${Utils.formatSatoshi(transaction.data.fee)} is equal to ` +
                        `static fee (${Utils.formatSatoshi(transaction.staticFee)})`,
                );
                return true;
            }

            this.logger.debug(
                `Transaction ${transaction.id} not eligible for broadcast - ` +
                    `fee of ${Utils.formatSatoshi(transaction.data.fee)} does not match ` +
                    `static fee (${Utils.formatSatoshi(transaction.staticFee)})`,
            );
            return false;
        }
    }
}
