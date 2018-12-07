import { constants } from "@arkecosystem/crypto";
import { transaction } from "./transaction";

const { DELEGATE_REGISTRATION } = constants.TRANSACTION_TYPES;

export const delegateRegistration = (
  network,
  passphrase,
  quantity: number = 10,
  getStruct: boolean = false,
  fee?: number
) =>
  transaction(
    network,
    DELEGATE_REGISTRATION,
    passphrase,
    undefined,
    undefined,
    quantity,
    getStruct,
    fee
  );
