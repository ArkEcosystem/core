import { Interfaces } from "@arkecosystem/crypto";

export class PoolError extends Error {
    public readonly type: string;
    public readonly transaction: Interfaces.ITransaction;

    public constructor(message: string, type: string, transaction: Interfaces.ITransaction) {
        super(message);
        this.type = type;
        this.transaction = transaction;
    }
}
