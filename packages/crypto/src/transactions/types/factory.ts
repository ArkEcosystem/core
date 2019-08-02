import { TransactionConstructor } from "..";
import { TransactionTypes } from "../../enums";
import { UnkownTransactionError } from "../../errors";
import { ITransaction, ITransactionData } from "../../interfaces";

export class TransactionTypeFactory {
    public static initialize(coreTypes: Map<TransactionTypes, TransactionConstructor>) {
        this.transactionTypes = coreTypes;
    }

    public static create(data: ITransactionData): ITransaction {
        const instance: ITransaction = new (this.get(data.type) as any)() as ITransaction;
        instance.data = data;
        instance.data.version = data.version || 1;

        return instance;
    }

    public static get(type: TransactionTypes | number): TransactionConstructor {
        if (this.transactionTypes.has(type)) {
            return this.transactionTypes.get(type);
        }

        throw new UnkownTransactionError(type);
    }

    private static transactionTypes: Map<TransactionTypes, TransactionConstructor>;
}
