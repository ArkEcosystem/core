import { CryptoManager } from "../../../crypto-manager";
import { ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionFactory } from "../../factory";
import { TransactionTools } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class VoteBuilder<T, U extends ITransactionData = ITransactionData, E = SchemaError> extends TransactionBuilder<
    T,
    VoteBuilder<T, U, E>,
    U,
    E
> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionTools: TransactionTools<T, U, E>,
        transactionFactory: TransactionFactory<T, U, E>,
    ) {
        super(cryptoManager, transactionTools, transactionFactory);
        this.data.type = Two.VoteTransaction.type;
        this.data.typeGroup = Two.VoteTransaction.typeGroup;
        this.data.fee = Two.VoteTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.recipientId = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = { votes: [] };

        this.signWithSenderAsRecipient = true;
    }

    public votesAsset(votes: string[]): VoteBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.votes) {
            this.data.asset.votes = votes;
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

    protected instance(): VoteBuilder<T, U, E> {
        return this;
    }
}
