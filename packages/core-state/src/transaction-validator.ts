import { TransactionsManager } from "@arkecosystem/core-crypto";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";
import { strictEqual } from "assert";

@Container.injectable()
export class TransactionValidator implements Contracts.State.TransactionValidator {
    @Container.inject(Container.Identifiers.TransactionManager)
    private readonly transactionsManager!: TransactionsManager;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "clone")
    private readonly handlerRegistry!: Handlers.Registry;

    public async validate(transaction: Interfaces.ITransaction): Promise<void> {
        const deserialized: Interfaces.ITransaction = this.transactionsManager.TransactionFactory.fromBytes(
            transaction.serialized,
        );
        strictEqual(transaction.id, deserialized.id);
        const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);
        await handler.apply(transaction);
    }
}
