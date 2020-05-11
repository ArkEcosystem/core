import { CryptoManager } from "../../crypto-manager";
import { ITransactionData, SchemaError } from "../../interfaces";
import { TransactionsManager } from "../transactions-manager";
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
    public constructor(
        private cryptoManager: CryptoManager<T>,
        private transactionsManager: TransactionsManager<T, U, E>,
    ) {}

    public transfer(): TransferBuilder<T, U, E> {
        return new TransferBuilder(this.cryptoManager, this.transactionsManager);
    }

    public secondSignature(): SecondSignatureBuilder<T, U, E> {
        return new SecondSignatureBuilder(this.cryptoManager, this.transactionsManager);
    }

    public delegateRegistration(): DelegateRegistrationBuilder<T, U, E> {
        return new DelegateRegistrationBuilder(this.cryptoManager, this.transactionsManager);
    }

    public vote(): VoteBuilder<T, U, E> {
        return new VoteBuilder(this.cryptoManager, this.transactionsManager);
    }

    public multiSignature(): MultiSignatureBuilder<T, U, E> {
        return new MultiSignatureBuilder(this.cryptoManager, this.transactionsManager);
    }

    public ipfs(): IPFSBuilder<T, U, E> {
        return new IPFSBuilder(this.cryptoManager, this.transactionsManager);
    }

    public multiPayment(): MultiPaymentBuilder<T, U, E> {
        return new MultiPaymentBuilder(this.cryptoManager, this.transactionsManager);
    }

    public delegateResignation(): DelegateResignationBuilder<T, U, E> {
        return new DelegateResignationBuilder(this.cryptoManager, this.transactionsManager);
    }

    public htlcLock(): HtlcLockBuilder<T, U, E> {
        return new HtlcLockBuilder(this.cryptoManager, this.transactionsManager);
    }

    public htlcClaim(): HtlcClaimBuilder<T, U, E> {
        return new HtlcClaimBuilder(this.cryptoManager, this.transactionsManager);
    }

    public htlcRefund(): HtlcRefundBuilder<T, U, E> {
        return new HtlcRefundBuilder(this.cryptoManager, this.transactionsManager);
    }
}
