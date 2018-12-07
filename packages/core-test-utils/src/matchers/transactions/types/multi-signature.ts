import { constants } from "@arkecosystem/crypto";
const { MULTI_SIGNATURE } = constants.TRANSACTION_TYPES;

export default {
  toBeMultiSignatureType: received => {
    return {
      message: () =>
        "Expected value to be a valid MULTI_SIGNATURE transaction.",
      pass: received.type === MULTI_SIGNATURE
    };
  }
};
