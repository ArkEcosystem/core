import { CryptoManager } from "../../crypto-manager";
import { ITransactionData, SchemaError } from "../../interfaces";
import { TransactionTools } from "../transactions-manager";
import { DelegateRegistrationBuilder } from "./transactions/delegate-registration";
import { DelegateResignationBuilder } from "./transactions/delegate-resignation";
import { HtlcClaimBuilder } from "./transactions/htlc-claim";
import { HtlcLockBuilder } from "./transactions/htlc-lock";
import { HtlcRefundBuilder } from "./transactions/htlc-refund";
import { IPFSBuilder } from "./transactions/ipfs";
import { MultiPaymentBuilder } from "./transactions/multi-payment";
import { MultiSignatureBuilder } from "./transactions/multi-signature";
import { SecondSignatureBuilder } from "./transactions/second-signature";
import { TransferBuilder } from "./transactions/transfer";
import { VoteBuilder } from "./transactions/vote";
export * from "./transactions/transaction";

export class BuilderFactory<T, U extends ITransactionData = ITransactionData, E = SchemaError> {
    private transactionTools!: TransactionTools<T, U, E>;

    public constructor(private cryptoManager: CryptoManager<T>) {}

    public initialize(transactionTools: TransactionTools<T, U, E>) {
        this.transactionTools = transactionTools;
    }

    public transfer(): TransferBuilder<T, U, E> {
        return new TransferBuilder(this.cryptoManager, this.transactionTools);
    }

    public secondSignature(): SecondSignatureBuilder<T, U, E> {
        return new SecondSignatureBuilder(this.cryptoManager, this.transactionTools);
    }

    public delegateRegistration(): DelegateRegistrationBuilder<T, U, E> {
        return new DelegateRegistrationBuilder(this.cryptoManager, this.transactionTools);
    }

    public vote(): VoteBuilder<T, U, E> {
        return new VoteBuilder(this.cryptoManager, this.transactionTools);
    }

    public multiSignature(): MultiSignatureBuilder<T, U, E> {
        return new MultiSignatureBuilder(this.cryptoManager, this.transactionTools);
    }

    public ipfs(): IPFSBuilder<T, U, E> {
        return new IPFSBuilder(this.cryptoManager, this.transactionTools);
    }

    public multiPayment(): MultiPaymentBuilder<T, U, E> {
        return new MultiPaymentBuilder(this.cryptoManager, this.transactionTools);
    }

    public delegateResignation(): DelegateResignationBuilder<T, U, E> {
        return new DelegateResignationBuilder(this.cryptoManager, this.transactionTools);
    }

    public htlcLock(): HtlcLockBuilder<T, U, E> {
        return new HtlcLockBuilder(this.cryptoManager, this.transactionTools);
    }

    public htlcClaim(): HtlcClaimBuilder<T, U, E> {
        return new HtlcClaimBuilder(this.cryptoManager, this.transactionTools);
    }

    public htlcRefund(): HtlcRefundBuilder<T, U, E> {
        return new HtlcRefundBuilder(this.cryptoManager, this.transactionTools);
    }
}
