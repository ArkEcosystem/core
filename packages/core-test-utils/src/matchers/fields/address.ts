import { crypto } from "@arkecosystem/crypto";

export default {
  toBeArkAddress: (received, argument) => {
    return {
      message: () => "Expected value to be a valid address",
      pass: crypto.validateAddress(received, argument)
    };
  }
};
