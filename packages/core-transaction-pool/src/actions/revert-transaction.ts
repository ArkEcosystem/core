import { Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";

export class RevertTransactionAction extends Services.Triggers.Action {
    public async execute(args: ActionArguments): Promise<void> {
        const handler: Handlers.TransactionHandler = args.handler;
        const transaction: Interfaces.ITransaction = args.transaction;

        return handler.revert(transaction);
    }
}
