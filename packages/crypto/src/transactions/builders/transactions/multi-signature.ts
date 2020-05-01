import { CryptoManager } from "../../../crypto-manager";
import { IMultiSignatureAsset, ITransactionData } from "../../../interfaces";
import { TransactionFactory } from "../../factory";
import { Signer } from "../../signer";
import { Two } from "../../types";
import { Utils } from "../../utils";
import { Verifier } from "../../verifier";
import { TransactionBuilder } from "./transaction";

export class MultiSignatureBuilder<T, U extends ITransactionData, E> extends TransactionBuilder<
    T,
    U,
    E,
    MultiSignatureBuilder<T, U, E>
> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionFactory: TransactionFactory<T, U, E>,
        signer: Signer<T, U, E>,
        verifier: Verifier<T, U, E>,
        utils: Utils<T, U, E>,
    ) {
        super(cryptoManager, transactionFactory, signer, verifier, utils);

        this.data.type = Two.MultiSignatureRegistrationTransaction.type;
        this.data.typeGroup = Two.MultiSignatureRegistrationTransaction.typeGroup;
        this.data.version = 2;
        this.data.fee = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { multiSignature: { min: 0, publicKeys: [] } };
    }

    public participant(publicKey: string): MultiSignatureBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.multiSignature) {
            const { publicKeys }: IMultiSignatureAsset = this.data.asset.multiSignature;

            if (publicKeys.length <= 16) {
                publicKeys.push(publicKey);
                this.data.fee = Two.MultiSignatureRegistrationTransaction.staticFee(this.cryptoManager, {
                    data: this.data,
                });
            }
        }

        return this;
    }

    public min(min: number): MultiSignatureBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.multiSignature) {
            this.data.asset.multiSignature.min = min;
        }

        return this;
    }

    public multiSignatureAsset(multiSignature: IMultiSignatureAsset): MultiSignatureBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.multiSignature) {
            this.data.asset.multiSignature = multiSignature;
            this.data.fee = Two.MultiSignatureRegistrationTransaction.staticFee(this.cryptoManager, {
                data: this.data,
            });
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

    protected instance(): MultiSignatureBuilder<T, U, E> {
        return this;
    }
}
