import { DelegateRegistrationTransactionHandler } from "./delegate-registration";
import { DelegateResignationTransactionHandler } from "./delegate-resignation";
import { IpfsTransactionHandler } from "./ipfs";
import { MultiPaymentTransactionHandler } from "./multi-payment";
import { MultiSignatureTransactionHandler } from "./multi-signature";
import { SecondSignatureTransactionHandler } from "./second-signature";
import { TimelockTransferTransactionHandler } from "./timelock-transfer";
import { TransferTransactionHandler } from "./transfer";
import { VoteTransactionHandler } from "./vote";

export const transactionHandlers = [
    TransferTransactionHandler,
    SecondSignatureTransactionHandler,
    VoteTransactionHandler,
    DelegateRegistrationTransactionHandler,
    MultiSignatureTransactionHandler,
    IpfsTransactionHandler,
    TimelockTransferTransactionHandler,
    MultiPaymentTransactionHandler,
    DelegateResignationTransactionHandler,
];
