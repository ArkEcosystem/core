import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { SecondSignature } = constants.TransactionTypes;

export const generateSecondSignature = (
    network,
    passphrase,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, SecondSignature, passphrase, undefined, undefined, quantity, getStruct, fee);
