import { constants } from "@arkecosystem/crypto";
const { MULTI_PAYMENT } = constants.TRANSACTION_TYPES;

export default {
  toBeMultiPaymentType: received => {
    return {
      message: () => "Expected value to be a valid MULTI_PAYMENT transaction.",
      pass: received.type === MULTI_PAYMENT
    };
  }
};
