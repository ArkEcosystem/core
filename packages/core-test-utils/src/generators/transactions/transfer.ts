import { constants } from "@arkecosystem/crypto";
import { generateTransaction } from "./transaction";

const { TRANSFER } = constants.TRANSACTION_TYPES;

export const generateTransfers = (
    network,
    passphrase: any = "secret passphrase",
    address?: string,
    amount: number = 2,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => generateTransaction(network, TRANSFER, passphrase, address, amount, quantity, getStruct, fee);
