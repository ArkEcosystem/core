import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { DelegateRegistration } = constants.TransactionTypes;

export const generateDelegateRegistration = (
    network,
    passphrase,
    quantity: number = 1,
    getStruct: boolean = false,
    fee?: number,
) => {
    if (Array.isArray(passphrase)) {
        return passphrase.map(
            p => generateTransaction(network, DelegateRegistration, p, undefined, undefined, 1, getStruct, fee)[0],
        );
    }
    return generateTransaction(
        network,
        DelegateRegistration,
        passphrase,
        undefined,
        undefined,
        quantity,
        getStruct,
        fee,
    );
};
