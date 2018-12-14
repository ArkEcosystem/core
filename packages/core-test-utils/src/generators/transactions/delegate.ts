import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { DELEGATE_REGISTRATION } = constants.TRANSACTION_TYPES;

export const generateDelegateRegistration = (
    network,
    passphrase,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, DELEGATE_REGISTRATION, passphrase, undefined, undefined, quantity, getStruct, fee);
