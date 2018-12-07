import { constants } from "@arkecosystem/crypto";
import { transaction } from "./transaction";

const { VOTE } = constants.TRANSACTION_TYPES;

export const vote = (
  network,
  passphrase,
  publicKey,
  quantity: number = 10,
  getStruct: boolean = false,
  fee?: number
) =>
  transaction(
    network,
    VOTE,
    passphrase,
    publicKey,
    undefined,
    quantity,
    getStruct,
    fee
  );
