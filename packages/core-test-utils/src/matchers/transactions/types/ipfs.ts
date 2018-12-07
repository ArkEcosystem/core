import { constants } from "@arkecosystem/crypto";
const { IPFS } = constants.TRANSACTION_TYPES;

export default {
  toBeIpfsType: received => {
    return {
      message: () => "Expected value to be a valid IPFS transaction.",
      pass: received.type === IPFS
    };
  }
};
