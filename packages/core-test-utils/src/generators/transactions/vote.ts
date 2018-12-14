import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { VOTE } = constants.TRANSACTION_TYPES;

export const generateVote = (
    network,
    passphrase,
    publicKey,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, VOTE, passphrase, publicKey, undefined, quantity, getStruct, fee);
