import camelCase from "lodash.camelcase";
import { TransactionTypes } from "../enums";
import {
    MissingMilestoneFeeError,
    TransactionAlreadyRegisteredError,
    TransactionTypeInvalidRangeError,
    UnkownTransactionError,
} from "../errors";
import { ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { feeManager } from "../managers/fee";
import { AjvWrapper } from "../validation";
import {
    DelegateRegistrationTransaction,
    DelegateResignationTransaction,
    IpfsTransaction,
    MultiPaymentTransaction,
    MultiSignatureRegistrationTransaction,
    SecondSignatureRegistrationTransaction,
    TimelockTransferTransaction,
    Transaction,
    TransferTransaction,
    VoteTransaction,
} from "./types";

export type TransactionConstructor = typeof Transaction;

class TransactionRegistry {
    private readonly coreTypes = new Map<TransactionTypes, TransactionConstructor>();
    private readonly customTypes = new Map<number, TransactionConstructor>();

    constructor() {
        this.registerCoreType(TransferTransaction);
        this.registerCoreType(SecondSignatureRegistrationTransaction);
        this.registerCoreType(DelegateRegistrationTransaction);
        this.registerCoreType(VoteTransaction);
        this.registerCoreType(MultiSignatureRegistrationTransaction);
        this.registerCoreType(IpfsTransaction);
        this.registerCoreType(TimelockTransferTransaction);
        this.registerCoreType(MultiPaymentTransaction);
        this.registerCoreType(DelegateResignationTransaction);
    }

    public create(data: ITransactionData): Transaction {
        const instance = new (this.get(data.type) as any)() as Transaction;
        instance.data = data;

        return instance;
    }

    public get(type: TransactionTypes | number): TransactionConstructor {
        if (this.coreTypes.has(type)) {
            return this.coreTypes.get(type);
        }

        if (this.customTypes.has(type)) {
            return this.customTypes.get(type);
        }

        throw new UnkownTransactionError(type);
    }

    public registerCustomType(constructor: TransactionConstructor): void {
        const { type } = constructor;
        if (this.customTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        if (type < 100) {
            throw new TransactionTypeInvalidRangeError(type);
        }

        this.customTypes.set(type, constructor);
        this.updateSchemas(constructor);
        this.updateStaticFees();
    }

    public deregisterCustomType(type: number): void {
        if (this.customTypes.has(type)) {
            const schema = this.customTypes.get(type);
            this.updateSchemas(schema, true);
            this.customTypes.delete(type);
        }
    }

    public updateStaticFees(height?: number): void {
        const customConstructors = Array.from(this.customTypes.values());
        const milestone = configManager.getMilestone(height);
        const { staticFees } = milestone.fees;
        for (const constructor of customConstructors) {
            const { type, name } = constructor;
            if (milestone.fees && milestone.fees.staticFees) {
                const value = staticFees[camelCase(name.replace("Transaction", ""))];
                if (!value) {
                    throw new MissingMilestoneFeeError(name);
                }

                feeManager.set(type, value);
            }
        }
    }

    private registerCoreType(constructor: TransactionConstructor) {
        const { type } = constructor;
        if (this.coreTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        this.coreTypes.set(type, constructor);
        this.updateSchemas(constructor);
    }

    private updateSchemas(transaction: TransactionConstructor, remove?: boolean) {
        AjvWrapper.extendTransaction(transaction.getSchema(), remove);
    }
}

export const transactionRegistry = new TransactionRegistry();
