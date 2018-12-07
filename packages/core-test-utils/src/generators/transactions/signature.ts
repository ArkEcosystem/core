import { constants } from "@arkecosystem/crypto";
import { transaction } from "./transaction";

const { SECOND_SIGNATURE } = constants.TRANSACTION_TYPES;

export const secondSignature = (
  network,
  passphrase,
  quantity: number = 10,
  getStruct: boolean = false,
  fee?: number
) =>
  transaction(
    network,
    SECOND_SIGNATURE,
    passphrase,
    undefined,
    undefined,
    quantity,
    getStruct,
    fee
  );
