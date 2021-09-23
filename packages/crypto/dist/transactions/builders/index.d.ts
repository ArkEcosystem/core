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
export declare class BuilderFactory {
    static transfer(): TransferBuilder;
    static secondSignature(): SecondSignatureBuilder;
    static delegateRegistration(): DelegateRegistrationBuilder;
    static vote(): VoteBuilder;
    static multiSignature(): MultiSignatureBuilder;
    static ipfs(): IPFSBuilder;
    static multiPayment(): MultiPaymentBuilder;
    static delegateResignation(): DelegateResignationBuilder;
    static htlcLock(): HtlcLockBuilder;
    static htlcClaim(): HtlcClaimBuilder;
    static htlcRefund(): HtlcRefundBuilder;
}
