import { Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";

export class ThrowIfCannotEnterPoolAction extends Services.Triggers.Action {
    public execute(args: ActionArguments): any {
        const handler: Handlers.TransactionHandler = args.handler;
        const transaction: Interfaces.ITransaction = args.transaction;

        return handler.throwIfCannotEnterPool(transaction);
    }
}
