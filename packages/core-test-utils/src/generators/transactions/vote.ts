import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { Vote } = constants.TransactionTypes;

export const generateVote = (
    network,
    passphrase,
    publicKey,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, Vote, passphrase, publicKey, undefined, quantity, getStruct, fee);
