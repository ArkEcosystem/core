import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { DelegateRegistration } = constants.TransactionTypes;

export const generateDelegateRegistration = (
    network,
    passphrase,
    quantity: number = 1,
    getStruct: boolean = false,
    username?: string,
    fee?: number,
) => {
    if (Array.isArray(passphrase)) {
        return passphrase.map(
            p => generateTransaction(network, DelegateRegistration, p, username, undefined, 1, getStruct, fee)[0],
        );
    }
    return generateTransaction(
        network,
        DelegateRegistration,
        passphrase,
        username,
        undefined,
        quantity,
        getStruct,
        fee,
    );
};
