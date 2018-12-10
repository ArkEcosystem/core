import { delegateRegistration } from "./delegate-registration";
import { delegateResignation } from "./delegate-resignation";
import { ipfs } from "./ipfs";
import { multiPayment } from "./multi-payment";
import { multiSignature } from "./multi-signature";
import { secondSignature } from "./second-signature";
import { timelockTransfer } from "./timelock-transfer";
import { transfer } from "./transfer";
import { vote } from "./vote";

export const transactions = [
    transfer,
    secondSignature,
    delegateRegistration,
    vote,
    multiSignature,
    ipfs,
    timelockTransfer,
    multiPayment,
    delegateResignation,
];
