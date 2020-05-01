import { CryptoManager } from "..";
import { AddressNetworkError } from "../errors";
import { ISerializeOptions, ITransactionData } from "../interfaces";
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types/factory";

export class Utils<T, U extends ITransactionData, E> {
    public constructor(
        private cryptoManager: CryptoManager<T>,
        private serializer: Serializer<T, U, E>,
        private transactionTypeFactory: TransactionTypeFactory<T, U, E>,
    ) {}

    public toBytes(data: U): Buffer {
        return this.serializer.serialize(this.transactionTypeFactory.create(data));
    }

    public toHash(transaction: U, options?: ISerializeOptions): Buffer {
        return this.cryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(
            this.serializer.getBytes(transaction, options),
        );
    }

    public getId(transaction: U, options: ISerializeOptions = {}): string {
        const id: string = this.toHash(transaction, options).toString("hex");

        // WORKAROUND:
        // A handful of mainnet transactions have an invalid recipient. Due to a
        // refactor of the Address network byte validation it is no longer
        // trivially possible to handle them. If an invalid address is encountered
        // during transfer serialization, the error is bubbled up to defer the
        // `AddressNetworkByteError` until the actual id is available to call
        // `isException`.
        if (options.addressError && !this.cryptoManager.LibraryManager.Utils.isException(id)) {
            throw new AddressNetworkError(options.addressError);
        }

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = this.cryptoManager.NetworkConfigManager.get("exceptions");

        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }
}
