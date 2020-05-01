import {
    TransactionAlreadyRegisteredError,
    TransactionKeyAlreadyRegisteredError,
    TransactionVersionAlreadyRegisteredError,
    UnkownTransactionError,
} from "../errors";
import { ITransactionData, Validator } from "../interfaces";
import { One, Transaction, Two } from "./types";
import { InternalTransactionType } from "./types/internal-transaction-type";

export type TransactionConstructor<T, U, E> = typeof Transaction;

export class TransactionRegistry<T, U extends ITransactionData, E> {
    private readonly transactionTypes: Map<
        InternalTransactionType,
        Map<number, TransactionConstructor<T, U, E>>
    > = new Map();

    public constructor(private validator: Validator<U, E>) {
        this.registerTransactionType(One.TransferTransaction);
        this.registerTransactionType(Two.TransferTransaction);

        this.registerTransactionType(One.SecondSignatureRegistrationTransaction);
        this.registerTransactionType(Two.SecondSignatureRegistrationTransaction);

        this.registerTransactionType(One.DelegateRegistrationTransaction);
        this.registerTransactionType(Two.DelegateRegistrationTransaction);

        this.registerTransactionType(One.VoteTransaction);
        this.registerTransactionType(Two.VoteTransaction);

        this.registerTransactionType(One.MultiSignatureRegistrationTransaction);
        this.registerTransactionType(Two.MultiSignatureRegistrationTransaction);

        this.registerTransactionType(Two.IpfsTransaction);

        this.registerTransactionType(Two.MultiPaymentTransaction);

        this.registerTransactionType(Two.DelegateResignationTransaction);

        this.registerTransactionType(Two.HtlcLockTransaction);
        this.registerTransactionType(Two.HtlcClaimTransaction);
        this.registerTransactionType(Two.HtlcRefundTransaction);
    }

    public registerTransactionType(constructor: TransactionConstructor<T, U, E>): void {
        const { typeGroup, type } = constructor;

        if (typeof type === "undefined" || typeof typeGroup === "undefined") {
            throw new Error();
        }

        const internalType: InternalTransactionType = InternalTransactionType.from(type, typeGroup);
        for (const registeredConstructors of this.transactionTypes.values()) {
            if (registeredConstructors.size) {
                const first = [...registeredConstructors.values()][0];
                if (
                    first.key === constructor.key &&
                    InternalTransactionType.from(first.type!, first.typeGroup) !== internalType
                ) {
                    throw new TransactionKeyAlreadyRegisteredError(first.key!);
                }

                for (const registeredConstructor of registeredConstructors.values()) {
                    if (registeredConstructor === constructor) {
                        throw new TransactionAlreadyRegisteredError(constructor.name);
                    }
                }
            }
        }

        if (!this.transactionTypes.has(internalType)) {
            this.transactionTypes.set(internalType, new Map());
        } else if (this.transactionTypes.get(internalType)?.has(constructor.version)) {
            throw new TransactionVersionAlreadyRegisteredError(constructor.name, constructor.version);
        }

        this.transactionTypes.get(internalType)!.set(constructor.version, constructor);
        this.updateSchemas(constructor);
    }

    public deregisterTransactionType(constructor: TransactionConstructor<T, U, E>): void {
        const { typeGroup, type, version } = constructor;

        if (typeof type === "undefined" || typeof typeGroup === "undefined") {
            throw new Error();
        }

        const internalType: InternalTransactionType = InternalTransactionType.from(type, typeGroup);
        if (!this.transactionTypes.has(internalType)) {
            throw new UnkownTransactionError(internalType.toString());
        }

        this.updateSchemas(constructor, true);

        const constructors = this.transactionTypes.get(internalType)!;
        if (!constructors.has(version)) {
            throw new UnkownTransactionError(internalType.toString());
        }

        constructors.delete(version);

        if (constructors.size === 0) {
            this.transactionTypes.delete(internalType);
        }
    }

    private updateSchemas(transaction: TransactionConstructor<T, U, E>, remove?: boolean): void {
        this.validator.extendTransaction(transaction.getSchema(), remove);
    }
}
