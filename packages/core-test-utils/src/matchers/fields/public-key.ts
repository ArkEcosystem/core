import { crypto } from "@arkecosystem/crypto";

export default {
  toBeArkPublicKey: received => {
    return {
      message: () => "Expected value to be a valid public key",
      pass: crypto.validatePublicKey(received)
    };
  }
};
