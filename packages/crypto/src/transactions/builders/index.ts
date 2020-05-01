import { CryptoManager } from "../../crypto-manager";
import { ITransactionData } from "../../interfaces";
import { TransactionFactory } from "../factory";
import { Signer } from "../signer";
import { Utils } from "../utils";
import { Verifier } from "../verifier";
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

export class BuilderFactory<T, U extends ITransactionData, E> {
    public constructor(
        private cryptoManager: CryptoManager<T>,
        private transactionFactory: TransactionFactory<T, U, E>,
        private signer: Signer<T, U, E>,
        private verifier: Verifier<T, U, E>,
        private utils: Utils<T, U, E>,
    ) {}

    public transfer(): TransferBuilder<T, U, E> {
        return new TransferBuilder(this.cryptoManager, this.transactionFactory, this.signer, this.verifier, this.utils);
    }

    public secondSignature(): SecondSignatureBuilder<T, U, E> {
        return new SecondSignatureBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }

    public delegateRegistration(): DelegateRegistrationBuilder<T, U, E> {
        return new DelegateRegistrationBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }

    public vote(): VoteBuilder<T, U, E> {
        return new VoteBuilder(this.cryptoManager, this.transactionFactory, this.signer, this.verifier, this.utils);
    }

    public multiSignature(): MultiSignatureBuilder<T, U, E> {
        return new MultiSignatureBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }

    public ipfs(): IPFSBuilder<T, U, E> {
        return new IPFSBuilder(this.cryptoManager, this.transactionFactory, this.signer, this.verifier, this.utils);
    }

    public multiPayment(): MultiPaymentBuilder<T, U, E> {
        return new MultiPaymentBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }

    public delegateResignation(): DelegateResignationBuilder<T, U, E> {
        return new DelegateResignationBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }

    public htlcLock(): HtlcLockBuilder<T, U, E> {
        return new HtlcLockBuilder(this.cryptoManager, this.transactionFactory, this.signer, this.verifier, this.utils);
    }

    public htlcClaim(): HtlcClaimBuilder<T, U, E> {
        return new HtlcClaimBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }

    public htlcRefund(): HtlcRefundBuilder<T, U, E> {
        return new HtlcRefundBuilder(
            this.cryptoManager,
            this.transactionFactory,
            this.signer,
            this.verifier,
            this.utils,
        );
    }
}
