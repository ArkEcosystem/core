import { constants } from "@arkecosystem/crypto";
const { VOTE } = constants.TRANSACTION_TYPES;

export default {
  toBeVoteType: received => {
    return {
      message: () => "Expected value to be a valid VOTE transaction.",
      pass: received.type === VOTE
    };
  }
};
