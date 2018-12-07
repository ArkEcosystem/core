import { constants } from "@arkecosystem/crypto";
const { TIMELOCK_TRANSFER } = constants.TRANSACTION_TYPES;

export default {
  toBeTimelockTransferType: received => {
    return {
      message: () =>
        "Expected value to be a valid TIMELOCK_TRANSFER transaction.",
      pass: received.type === TIMELOCK_TRANSFER
    };
  }
};
