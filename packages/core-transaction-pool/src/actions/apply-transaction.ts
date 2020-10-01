import { Services, Types } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";

export class ApplyTransactionAction extends Services.Triggers.Action {
    public async execute(args: Types.ActionArguments): Promise<void> {
        const handler: Handlers.TransactionHandler = args.handler;
        const transaction: Interfaces.ITransaction = args.transaction;

        return handler.apply(transaction);
    }
}
