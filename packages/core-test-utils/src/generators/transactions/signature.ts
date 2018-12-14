import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { SECOND_SIGNATURE } = constants.TRANSACTION_TYPES;

export const generateSecondSignature = (
    network,
    passphrase,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, SECOND_SIGNATURE, passphrase, undefined, undefined, quantity, getStruct, fee);
