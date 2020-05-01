import { CryptoManager } from "../../../crypto-manager";
import { IHtlcRefundAsset, ITransactionData } from "../../../interfaces";
import { TransactionFactory } from "../../factory";
import { Signer } from "../../signer";
import { Two } from "../../types";
import { Utils } from "../../utils";
import { Verifier } from "../../verifier";
import { TransactionBuilder } from "./transaction";

export class HtlcRefundBuilder<T, U extends ITransactionData, E> extends TransactionBuilder<
    T,
    U,
    E,
    HtlcRefundBuilder<T, U, E>
> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionFactory: TransactionFactory<T, U, E>,
        signer: Signer<T, U, E>,
        verifier: Verifier<T, U, E>,
        utils: Utils<T, U, E>,
    ) {
        super(cryptoManager, transactionFactory, signer, verifier, utils);

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
