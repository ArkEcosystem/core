import { TransactionConstructor } from "..";
import { TransactionTypes } from "../../enums";
import { UnkownTransactionError } from "../../errors";
import { ITransaction, ITransactionData } from "../../interfaces";

export class TransactionTypeFactory {
    public static initialize(
        coreTypes: Map<TransactionTypes, TransactionConstructor>,
        customTypes: Map<TransactionTypes, TransactionConstructor>,
    ) {
        this.coreTypes = coreTypes;
        this.customTypes = customTypes;
    }

    public static create(data: ITransactionData): ITransaction {
        const instance: ITransaction = new (this.get(data.type) as any)() as ITransaction;
        instance.data = data;
        instance.data.version = data.version || 1;

        return instance;
    }

    public static get(type: TransactionTypes | number): TransactionConstructor {
        if (this.coreTypes.has(type)) {
            return this.coreTypes.get(type);
        }

        if (this.customTypes.has(type)) {
            return this.customTypes.get(type);
        }

        throw new UnkownTransactionError(type);
    }

    private static coreTypes: Map<TransactionTypes, TransactionConstructor>;
    private static customTypes: Map<number, TransactionConstructor>;
}
