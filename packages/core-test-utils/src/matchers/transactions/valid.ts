import { crypto } from "@arkecosystem/crypto";

export default {
  toBeValidTransaction: (transaction, network) => {
    return {
      message: () => "Expected value to be a valid transaction",
      pass: crypto.verify(transaction, network)
    };
  }
};
