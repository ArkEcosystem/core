import { constants } from "@arkecosystem/crypto";
const { DELEGATE_RESIGNATION } = constants.TRANSACTION_TYPES;

export default {
  toBeDelegateResignationType: received => {
    return {
      message: () =>
        "Expected value to be a valid DELEGATE_RESIGNATION transaction.",
      pass: received.type === DELEGATE_RESIGNATION
    };
  }
};
