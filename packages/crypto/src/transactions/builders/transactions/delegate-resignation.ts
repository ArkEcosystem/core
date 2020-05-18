import { CryptoManager } from "../../../crypto-manager";
import { ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionTools } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, DelegateResignationBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionTools: TransactionTools<T, U, E>) {
        super(cryptoManager, transactionTools);
        this.data.type = Two.DelegateResignationTransaction.type;
        this.data.typeGroup = Two.DelegateResignationTransaction.typeGroup;
        this.data.version = 2;
        this.data.fee = Two.DelegateResignationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

        this.data.senderPublicKey = undefined;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        return struct;
    }

    protected instance(): DelegateResignationBuilder<T, U, E> {
        return this;
    }
}
