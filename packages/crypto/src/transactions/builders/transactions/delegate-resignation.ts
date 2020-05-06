import { CryptoManager } from "../../../crypto-manager";
import { ITransactionData } from "../../../interfaces";
import { TransactionsManager } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class DelegateResignationBuilder<T, U extends ITransactionData, E> extends TransactionBuilder<
    T,
    U,
    E,
    DelegateResignationBuilder<T, U, E>
> {
    public constructor(cryptoManager: CryptoManager<T>, transactionsManager: TransactionsManager<T, U, E>) {
        super(cryptoManager, transactionsManager);
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
