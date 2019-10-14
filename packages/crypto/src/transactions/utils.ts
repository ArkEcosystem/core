import { HashAlgorithms } from "../crypto";
import { AddressNetworkError } from '../errors';
import { ISerializeOptions, ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { isException } from '../utils';
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types/factory";

export class Utils {
    public static toBytes(data: ITransactionData): Buffer {
        return Serializer.serialize(TransactionTypeFactory.create(data));
    }

    public static toHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        return HashAlgorithms.sha256(Serializer.getBytes(transaction, options));
    }

    public static getId(transaction: ITransactionData, options?: ISerializeOptions): string {
        const id: string = Utils.toHash(transaction, options).toString("hex");

        // WORKAROUND:
        // A handful of mainnet transactions have an invalid recipient. Due to a
        // refactor of the Address network byte validation it is no longer
        // trivially possible to handle them. If an invalid address is encountered
        // during transfer serialization, the error is bubbled up to defer the
        // `AddressNetworkByteError` until the actual id is available to call
        // `isException`.
        if (options && options.addressError && !isException({ id })) {
            throw new AddressNetworkError(options.addressError)
        }

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");

        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }
}
