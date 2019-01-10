import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { SecondSignature } = constants.TransactionTypes;

export const generateSecondSignature = (
    network,
    passphrase,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => {
    if (Array.isArray(passphrase)) {
        return passphrase.map(
            p => generateTransaction(network, SecondSignature, p, undefined, undefined, 1, getStruct, fee)[0],
        );
    }
    return generateTransaction(network, SecondSignature, passphrase, undefined, undefined, quantity, getStruct, fee);
};
