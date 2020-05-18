import { CryptoManager } from "../../../crypto-manager";
import { MaximumPaymentCountExceededError, MinimumPaymentCountSubceededError } from "../../../errors";
import { ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionTools } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class MultiPaymentBuilder<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends TransactionBuilder<T, MultiPaymentBuilder<T, U, E>, U, E> {
    public constructor(cryptoManager: CryptoManager<T>, transactionTools: TransactionTools<T, U, E>) {
        super(cryptoManager, transactionTools);
        this.data.type = Two.MultiPaymentTransaction.type;
        this.data.typeGroup = Two.MultiPaymentTransaction.typeGroup;
        this.data.fee = Two.MultiPaymentTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.vendorField = undefined;
        this.data.asset = {
            payments: [],
        };
    }

    public addPayment(recipientId: string, amount: string): MultiPaymentBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.payments) {
            const limit: number = this.cryptoManager.MilestoneManager.getMilestone().multiPaymentLimit || 256;
            if (this.data.asset.payments.length >= limit) {
                throw new MaximumPaymentCountExceededError(limit);
            }

            this.data.asset.payments.push({
                amount: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(amount),
                recipientId,
            });
        }

        return this;
    }

    public getStruct(): U {
        if (
            !this.data.asset ||
            !this.data.asset.payments ||
            !Array.isArray(this.data.asset.payments) ||
            this.data.asset.payments.length <= 1
        ) {
            throw new MinimumPaymentCountSubceededError();
        }

        const struct: U = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.vendorField = this.data.vendorField;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;

        return struct;
    }

    protected instance(): MultiPaymentBuilder<T, U, E> {
        return this;
    }
}
