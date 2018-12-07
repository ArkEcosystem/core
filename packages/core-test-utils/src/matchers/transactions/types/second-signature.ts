import { constants } from "@arkecosystem/crypto";
const { SECOND_SIGNATURE } = constants.TRANSACTION_TYPES;

export default {
  toBeSecondSignatureType: received => {
    return {
      message: () =>
        "Expected value to be a valid SECOND_SIGNATURE transaction.",
      pass: received.type === SECOND_SIGNATURE
    };
  }
};
