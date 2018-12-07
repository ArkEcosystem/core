import { crypto } from "@arkecosystem/crypto";

export default {
  toHaveValidSecondSignature: (actual, expected) => {
    let verified;

    try {
      verified = crypto.verifySecondSignature(actual, expected.publicKey);
    } catch (e) {} // tslint:disable-line

    return {
      message: () => "Expected value to have a valid second signature",
      pass: !!verified
    };
  }
};
