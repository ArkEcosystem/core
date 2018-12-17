import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { Transfer } = constants.TransactionTypes;

export const generateTransfers = (
    network,
    passphrase: any = "secret passphrase",
    address?: string,
    amount: number = 2,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, Transfer, passphrase, address, amount, quantity, getStruct, fee);
