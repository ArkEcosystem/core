import { Container, Contracts, Providers, Services } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import {
    RetryTransactionError,
    TransactionExceedsMaximumByteSizeError,
    TransactionFailedToApplyError,
    TransactionFailedToVerifyError,
    TransactionFromFutureError,
    TransactionFromWrongNetworkError,
    TransactionHasExpiredError,
} from "./errors";

@Container.injectable()
export class SenderState implements Contracts.TransactionPool.SenderState {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "copy-on-write")
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.TransactionPoolExpirationService)
    private readonly expirationService!: Contracts.TransactionPool.ExpirationService;

    private corrupt = false;

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        const maxTransactionBytes: number = this.configuration.getRequired<number>("maxTransactionBytes");
        if (JSON.stringify(transaction.data).length > maxTransactionBytes) {
            throw new TransactionExceedsMaximumByteSizeError(transaction, maxTransactionBytes);
        }

        const currentNetwork: number = Managers.configManager.get<number>("network.pubKeyHash");
        if (transaction.data.network && transaction.data.network !== currentNetwork) {
            throw new TransactionFromWrongNetworkError(transaction, currentNetwork);
        }

        const now: number = Crypto.Slots.getTime();
        if (transaction.timestamp > now + 3600) {
            const secondsInFuture: number = transaction.timestamp - now;
            throw new TransactionFromFutureError(transaction, secondsInFuture);
        }

        if (this.expirationService.isExpired(transaction)) {
            const expirationHeight: number = this.expirationService.getExpirationHeight(transaction);
            throw new TransactionHasExpiredError(transaction, expirationHeight);
        }

        const handler: Handlers.TransactionHandler = await this.handlerRegistry.getActivatedHandlerForData(
            transaction.data,
        );

        if (
            await this.app
                .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                .call("verifyTransaction", { handler, transaction })
        ) {
            if (this.corrupt) {
                throw new RetryTransactionError(transaction);
            }

            try {
                await this.app
                    .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                    .call("throwIfCannotEnterPool", { handler, transaction });

                await this.app
                    .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                    .call("applyTransaction", { handler, transaction });
            } catch (error) {
                throw new TransactionFailedToApplyError(transaction, error);
            }
        } else {
            throw new TransactionFailedToVerifyError(transaction);
        }
    }

    public async revert(transaction: Interfaces.ITransaction): Promise<void> {
        try {
            const handler: Handlers.TransactionHandler = await this.handlerRegistry.getActivatedHandlerForData(
                transaction.data,
            );

            await this.app
                .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                .call("revertTransaction", { handler, transaction });
        } catch (error) {
            this.corrupt = true;
            throw error;
        }
    }
}
