import { CryptoManager } from "../..";
import { UnkownTransactionError } from "../../errors";
import { ITransaction, ITransactionData } from "../../interfaces";
import { TransactionsManager } from "../transactions-manager";
import { InternalTransactionType } from "./internal-transaction-type";
import { Transaction } from "./transaction";

type TransactionConstructor = typeof Transaction;

export class TransactionTypeFactory<T, U extends ITransactionData, E> {
    private transactionTypes: Map<InternalTransactionType, Map<number, TransactionConstructor>>;

    public constructor(
        private cryptoManager: CryptoManager<T>,
        private transactionsManager: TransactionsManager<T, U, E>,
        transactionTypes: Map<InternalTransactionType, Map<number, TransactionConstructor>>,
    ) {
        this.transactionTypes = transactionTypes;
    }

    public create(data: U): ITransaction<U, E> {
        const instance: ITransaction<U, E> = new (this.get(
            data.type,
            data.typeGroup,
            data.version,
        ) as any)() as ITransaction<U, E>;
        instance.data = data;
        instance.data.version = data.version || 1;

        // @ts-ignore
        instance.cryptoManager = this.cryptoManager;
        // @ts-ignore
        instance.verifier = this.verifier;
        // @ts-ignore
        instance.transactionsManager = this.transactionsManager;

        return instance;
    }

    public get(type: number, typeGroup?: number, version?: number): TransactionConstructor | undefined {
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
