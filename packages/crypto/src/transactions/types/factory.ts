import { CryptoManager } from "../..";
import { UnkownTransactionError } from "../../errors";
import { ITransaction, ITransactionData, SchemaError } from "../../interfaces";
import { TransactionFactory } from "../factory";
import { TransactionTools } from "../transactions-manager";
import { InternalTransactionType } from "./internal-transaction-type";
import { Transaction } from "./transaction";

type TransactionConstructor = typeof Transaction;

export class TransactionTypeFactory<T, U extends ITransactionData = ITransactionData, E = SchemaError> {
    private transactionTypes: Map<InternalTransactionType, Map<number, TransactionConstructor>>;
    private transactionTools!: TransactionTools<T, U, E>;
    private transactionFactory!: TransactionFactory<T, U, E>;

    public constructor(
        private cryptoManager: CryptoManager<T>,
        transactionTypes: Map<InternalTransactionType, Map<number, TransactionConstructor>>,
    ) {
        this.transactionTypes = transactionTypes;
    }

    public initialize(transactionTools: TransactionTools<T, U, E>, transactionFactory: TransactionFactory<T, U, E>) {
        this.transactionTools = transactionTools;
        this.transactionFactory = transactionFactory;
    }

    public create(data: U): ITransaction<U, E> {
        const instance: ITransaction<U, E> = new (this.get(data.type, data.typeGroup, data.version) as any)(
            this.cryptoManager,
            this.transactionTools,
            this.transactionFactory,
        ) as ITransaction<U, E>;
        instance.data = data;
        instance.data.version = data.version || 1;

        return instance;
    }

    public get(type: number, typeGroup?: number, version?: number): TransactionConstructor {
        const internalType: InternalTransactionType = InternalTransactionType.from(type, typeGroup);

        if (!this.transactionTypes.has(internalType)) {
            throw new UnkownTransactionError(internalType.toString());
        }

        // Either there is a match for the provided version or use the first available constructor as a fallback
        const constructor: TransactionConstructor | undefined = this.transactionTypes
            .get(internalType)
            ?.get(version || 1);
        return constructor ?? [...this.transactionTypes.get(internalType)!.values()][0];
    }
}
