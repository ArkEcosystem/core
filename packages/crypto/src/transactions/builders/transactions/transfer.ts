import { CryptoManager } from "../../../crypto-manager";
import { ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionsManager } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class TransferBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, TransferBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionsManager: TransactionsManager<T, U, E>) {
        super(cryptoManager, transactionsManager);

        this.data.type = Two.TransferTransaction.type;
        this.data.typeGroup = Two.TransferTransaction.typeGroup;
        this.data.fee = Two.TransferTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.expiration = 0;
    }

    public expiration(expiration: number): TransferBuilder<T, U, E> {
        this.data.expiration = expiration;

        return this.instance();
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;
        struct.expiration = this.data.expiration;

        return struct;
    }

    protected instance(): TransferBuilder<T, U, E> {
        return this;
    }
}
