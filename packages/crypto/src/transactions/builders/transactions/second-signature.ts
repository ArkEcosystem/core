import { CryptoManager } from "../../../crypto-manager";
import { ITransactionAsset, ITransactionData } from "../../../interfaces";
import { TransactionFactory } from "../../factory";
import { Signer } from "../../signer";
import { Two } from "../../types";
import { Utils } from "../../utils";
import { Verifier } from "../../verifier";
import { TransactionBuilder } from "./transaction";

export class SecondSignatureBuilder<T, U extends ITransactionData, E> extends TransactionBuilder<
    T,
    U,
    E,
    SecondSignatureBuilder<T, U, E>
> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionFactory: TransactionFactory<T, U, E>,
        signer: Signer<T, U, E>,
        verifier: Verifier<T, U, E>,
        utils: Utils<T, U, E>,
    ) {
        super(cryptoManager, transactionFactory, signer, verifier, utils);

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
