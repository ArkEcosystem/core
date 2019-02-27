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
) => {
    if (Array.isArray(passphrase)) {
        return passphrase.map(p => generateTransaction(network, Vote, p, publicKey, undefined, 1, getStruct, fee)[0]);
    }
    return generateTransaction(network, Vote, passphrase, publicKey, undefined, quantity, getStruct, fee);
};
