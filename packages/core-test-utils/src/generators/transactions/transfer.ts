import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { Transfer } = constants.TransactionTypes;

export const generateTransfers = (
    network: string,
    passphrase: any = "secret passphrase",
    address?: string,
    amount: number = 2,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => {
    if (Array.isArray(passphrase)) {
        return passphrase.map(
            p => generateTransaction(network, Transfer, passphrase, address, amount, 1, getStruct, fee)[0],
        );
    }
    return generateTransaction(network, Transfer, passphrase, address, amount, quantity, getStruct, fee);
};
