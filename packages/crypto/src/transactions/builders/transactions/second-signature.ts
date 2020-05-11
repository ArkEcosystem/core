import { CryptoManager } from "../../../crypto-manager";
import { ITransactionAsset, ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionsManager } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class SecondSignatureBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, SecondSignatureBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionsManager: TransactionsManager<T, U, E>) {
        super(cryptoManager, transactionsManager);

        this.data.type = Two.SecondSignatureRegistrationTransaction.type;
        this.data.typeGroup = Two.SecondSignatureRegistrationTransaction.typeGroup;
        this.data.fee = Two.SecondSignatureRegistrationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { signature: {} } as ITransactionAsset;
    }

    public signatureAsset(secondPassphrase: string): SecondSignatureBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.signature) {
            this.data.asset.signature.publicKey = this.cryptoManager.Identities.Keys.fromPassphrase(
                secondPassphrase,
            ).publicKey;
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

    protected instance(): SecondSignatureBuilder<T, U, E> {
        return this;
    }
}
