import { constants } from "@arkecosystem/crypto";
import { transaction } from "./transaction";

const { TRANSFER } = constants.TRANSACTION_TYPES;

export const generateTransfers = (
  network,
  passphrase,
  address?: string,
  amount: number = 2,
  quantity: number = 10,
  getStruct: boolean = false,
  fee?: number
) =>
  transaction(
    network,
    TRANSFER,
    passphrase,
    address,
    amount,
    quantity,
    getStruct,
    fee
  );
