import { HashAlgorithms } from "../crypto";
import { ISerializeOptions, ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types/factory";

export class Utils {
    public static toBytes(data: ITransactionData): Buffer {
        return Serializer.serialize(TransactionTypeFactory.create(data));
    }

    public static toHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        return HashAlgorithms.sha256(Serializer.getBytes(transaction, options));
    }

    public static getId(transaction: ITransactionData): string {
        const id: string = Utils.toHash(transaction).toString("hex");

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");

        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }
}
