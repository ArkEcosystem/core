import { CryptoManager } from "../../../crypto-manager";
import { ITransactionAsset, ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionsManager } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class DelegateRegistrationBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, DelegateRegistrationBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionsManager: TransactionsManager<T, U, E>) {
        super(cryptoManager, transactionsManager);
        this.data.type = Two.DelegateRegistrationTransaction.type;
        this.data.typeGroup = Two.DelegateRegistrationTransaction.typeGroup;
        this.data.fee = Two.DelegateRegistrationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { delegate: {} } as ITransactionAsset;
    }

    public usernameAsset(username: string): DelegateRegistrationBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.delegate) {
            this.data.asset.delegate.username = username;
        }

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.recipientId = this.data.recipientId;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): DelegateRegistrationBuilder<T, U, E> {
        return this;
    }
}
