import { constants } from "@arkecosystem/crypto";
const { TRANSFER } = constants.TRANSACTION_TYPES;

export default {
  toBeTransferType: received => {
    return {
      message: () => "Expected value to be a valid TRANSFER transaction.",
      pass: received.type === TRANSFER
    };
  }
};
