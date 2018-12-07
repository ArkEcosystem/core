const { crypto } = require("@arkecosystem/crypto");

const toHaveValidSecondSignature = (actual, expected) => {
  let verified;
  try {
    verified = crypto.verifySecondSignature(actual, expected.publicKey);
  } catch (e) {}
  return {
    message: () => "Expected value to have a valid second signature",
    pass: !!verified
  };
};

expect.extend({
  toHaveValidSecondSignature
});
