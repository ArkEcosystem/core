import { DelegateRegistrationBuilder } from "./transactions/delegate-registration";
import { DelegateResignationBuilder } from "./transactions/delegate-resignation";
import { IPFSBuilder } from "./transactions/ipfs";
import { MultiPaymentBuilder } from "./transactions/multi-payment";
import { MultiSignatureBuilder } from "./transactions/multi-signature";
import { SecondSignatureBuilder } from "./transactions/second-signature";
import { TimelockTransferBuilder } from "./transactions/timelock-transfer";
import { TransferBuilder } from "./transactions/transfer";
import { VoteBuilder } from "./transactions/vote";

export class TransactionBuilderDirector {
    /**
     * Create new delegate transaction type.
     * @return {DelegateRegistrationBuilder}
     */
    public delegateRegistration() {
        return new DelegateRegistrationBuilder();
    }

    /**
     * Create new delegate resignation transaction type.
     * @return {DelegateResignationBuilder}
     */
    public delegateResignation() {
        return new DelegateResignationBuilder();
    }

    /**
     * Create new IPFS transaction type.
     * @return {IPFSBuilder}
     */
    public ipfs() {
        return new IPFSBuilder();
    }

    /**
     * Create new multi-payment transaction type.
     * @return {MultiPaymentBuilder}
     */
    public multiPayment() {
        return new MultiPaymentBuilder();
    }

    /**
     * Create new multi-signature transaction type.
     * @return {MultiSignatureBuilder}
     */
    public multiSignature() {
        return new MultiSignatureBuilder();
    }

    /**
     * Create new second signature transaction type.
     * @return {SecondSignatureBuilder}
     */
    public secondSignature() {
        return new SecondSignatureBuilder();
    }

    /**
     * Create new timelock transfer transaction type.
     * @return {TimelockTransferBuilder}
     */
    public timelockTransfer() {
        return new TimelockTransferBuilder();
    }

    /**
     * Create new transfer transaction type.
     * @return {TransferBuilder}
     */
    public transfer() {
        return new TransferBuilder();
    }

    /**
     * Create new vote transaction type.
     * @return {VoteBuilder}
     */
    public vote() {
        return new VoteBuilder();
    }
}

const transactionBuilder = new TransactionBuilderDirector();
export { transactionBuilder };
