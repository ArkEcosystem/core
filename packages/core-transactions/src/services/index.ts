import { DelegateRegistrationTransactionService } from "./delegate-registration";
import { DelegateResignationTransactionService } from "./delegate-resignation";
import { IpfsTransactionService } from "./ipfs";
import { MultiPaymentTransactionService } from "./multi-payment";
import { MultiSignatureTransactionService } from "./multi-signature";
import { SecondSignatureTransactionService } from "./second-signature";
import { TimelockTransferTransactionService } from "./timelock-transfer";
import { TransactionService } from "./transaction";
import { TransferTransactionService } from "./transfer";
import { VoteTransactionService } from "./vote";

export const transactionServices = [
    TransferTransactionService,
    SecondSignatureTransactionService,
    VoteTransactionService,
    DelegateRegistrationTransactionService,
    MultiSignatureTransactionService,
    IpfsTransactionService,
    TimelockTransferTransactionService,
    MultiPaymentTransactionService,
    DelegateResignationTransactionService,
];
