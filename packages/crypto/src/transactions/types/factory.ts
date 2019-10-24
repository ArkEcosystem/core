import { TransactionConstructor } from "..";
import { UnkownTransactionError } from "../../errors";
import { ITransaction, ITransactionData } from "../../interfaces";
import { InternalTransactionType } from "./internal-transaction-type";

export class TransactionTypeFactory {
    public static initialize(transactionTypes: Map<InternalTransactionType, TransactionConstructor>) {
        this.transactionTypes = transactionTypes;
    }

    public static create(data: ITransactionData): ITransaction {
        const instance: ITransaction = new (this.get(data.type, data.typeGroup) as any)() as ITransaction;
        instance.data = data;
        instance.data.version = data.version || 1;

        return instance;
    }

    public static get(type: number, typeGroup?: number): TransactionConstructor | undefined {
        const internalType: InternalTransactionType | undefined = InternalTransactionType.from(type, typeGroup);

        if (!internalType) {
            throw new Error();
        }

        if (this.transactionTypes.has(internalType)) {
            return this.transactionTypes.get(internalType);
        }

        throw new UnkownTransactionError(internalType.toString());
    }

    private static transactionTypes: Map<InternalTransactionType, TransactionConstructor>;
}
