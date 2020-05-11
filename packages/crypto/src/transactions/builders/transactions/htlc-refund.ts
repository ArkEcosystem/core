import { CryptoManager } from "../../../crypto-manager";
import { IHtlcRefundAsset, ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionsManager } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class HtlcRefundBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, HtlcRefundBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionsManager: TransactionsManager<T, U, E>) {
        super(cryptoManager, transactionsManager);
        this.data.type = Two.HtlcRefundTransaction.type;
        this.data.typeGroup = Two.HtlcRefundTransaction.typeGroup;
        this.data.fee = Two.HtlcRefundTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = {};
    }

    public htlcRefundAsset(refundAsset: IHtlcRefundAsset): HtlcRefundBuilder<T, U, E> {
        this.data.asset = {
            refund: refundAsset,
        };

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): HtlcRefundBuilder<T, U, E> {
        return this;
    }
}
