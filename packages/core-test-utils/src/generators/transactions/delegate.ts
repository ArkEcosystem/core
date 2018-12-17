import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { DelegateRegistration } = constants.TransactionTypes;

export const generateDelegateRegistration = (
    network,
    passphrase,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, DelegateRegistration, passphrase, undefined, undefined, quantity, getStruct, fee);
