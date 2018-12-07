import { constants } from "@arkecosystem/crypto";
const { DELEGATE } = constants.TRANSACTION_TYPES;

export default {
  toBeDelegateType: received => {
    return {
      message: () => "Expected value to be a valid DELEGATE transaction.",
      pass: received.type === DELEGATE
    };
  }
};
