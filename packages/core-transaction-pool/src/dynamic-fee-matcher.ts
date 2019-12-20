import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { DynamicFeeMatch } from "./interfaces";

/**
 * @export
 * @class DynamicFeeMatcher
 */
@Container.injectable()
export class DynamicFeeMatcher {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Processor
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof Processor
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {Providers.ServiceProviderRepository}
     * @memberof PortsResource
     */
    @Container.inject(Container.Identifiers.ServiceProviderRepository)
    private readonly serviceProviderRepository!: Providers.ServiceProviderRepository;

    /**
     * @private
     * @type {Contracts.State.StateStore}
     * @memberof DynamicFeeCalculator
     */
    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    /**
     * @param {Interfaces.ITransaction} transaction
     * @returns {Promise<DynamicFeeMatch>}
     * @memberof DynamicFeeMatcher
     */
    public async match(transaction: Interfaces.ITransaction): Promise<DynamicFeeMatch> {
        AppUtils.assert.defined<string>(transaction.id);

        const fee: Utils.BigNumber = transaction.data.fee;
        const id: string = transaction.id;

        const dynamicFees: Record<string, any> | undefined = this.serviceProviderRepository
            .get("@arkecosystem/core-transaction-pool")
            .config()
            .get<Record<string, any>>("dynamicFees");

        const height: number = this.stateStore.getLastHeight();

        AppUtils.assert.defined<Record<string, any>>(dynamicFees);

        let broadcast: boolean;
        let enterPool: boolean;

        if (dynamicFees.enabled) {
            const handler: Handlers.TransactionHandler = await this.app
                .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
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

                this.logger.debug(
                    `Transaction ${id} eligible for broadcast - fee of ${Utils.formatSatoshi(fee)} is ${
                        fee.isEqualTo(minFeeBroadcast) ? "equal to" : "greater than"
                    } minimum fee (${Utils.formatSatoshi(minFeeBroadcast)})`,
                );
            } else {
                broadcast = false;

                this.logger.debug(
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

                this.logger.debug(
                    `Transaction ${id} eligible to enter pool - fee of ${Utils.formatSatoshi(fee)} is ${
                        fee.isEqualTo(minFeePool) ? "equal to" : "greater than"
                    } minimum fee (${Utils.formatSatoshi(minFeePool)})`,
                );
            } else {
                enterPool = false;

                this.logger.debug(
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

                this.logger.debug(
                    `Transaction ${id} eligible for broadcast and to enter pool - fee of ${Utils.formatSatoshi(
                        fee,
                    )} is equal to static fee (${Utils.formatSatoshi(staticFee)})`,
                );
            } else {
                broadcast = false;
                enterPool = false;

                this.logger.debug(
                    `Transaction ${id} not eligible for broadcast and not eligible to enter pool - fee of ${Utils.formatSatoshi(
                        fee,
                    )} does not match static fee (${Utils.formatSatoshi(staticFee)})`,
                );
            }
        }

        return { broadcast, enterPool };
    }
}
