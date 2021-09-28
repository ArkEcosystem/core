import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class ProcessorDynamicFeeExtension implements Contracts.TransactionPool.ProcessorDynamicFeeExtension {
    @Container.inject(Container.Identifiers.TransactionPoolDynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: Contracts.TransactionPool.DynamicFeeMatcher;

    public async throwIfCannotBroadcast(transaction: Interfaces.ITransaction): Promise<void> {
        await this.dynamicFeeMatcher.throwIfCannotBroadcast(transaction);
    }
}
