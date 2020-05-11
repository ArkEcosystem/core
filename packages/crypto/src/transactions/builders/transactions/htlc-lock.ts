import { CryptoManager } from "../../../crypto-manager";
import { IHtlcLockAsset, ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionsManager } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class HtlcLockBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, HtlcLockBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionsManager: TransactionsManager<T, U, E>) {
        super(cryptoManager, transactionsManager);
        this.data.type = Two.HtlcLockTransaction.type;
        this.data.typeGroup = Two.HtlcLockTransaction.typeGroup;
        this.data.recipientId = undefined;
        this.data.fee = Two.HtlcLockTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.vendorField = undefined;
        this.data.asset = {};
    }

    public htlcLockAsset(lockAsset: IHtlcLockAsset): HtlcLockBuilder<T, U, E> {
        this.data.asset = {
            lock: lockAsset,
        };

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.vendorField = this.data.vendorField;
        struct.asset = this.data.asset;
        return struct;
    }

    public expiration(expiration: number): HtlcLockBuilder<T, U, E> {
        return this;
    }

    protected instance(): HtlcLockBuilder<T, U, E> {
        return this;
    }
}
