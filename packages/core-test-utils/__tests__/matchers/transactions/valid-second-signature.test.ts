import matcher from "../../../src/matchers/transactions/valid-second-signature";
expect.extend(matcher);

import { transfer, wallet } from "../../../src/generators";

const wallets = wallet("testnet", 2);
const transaction = transfer("testnet", wallets.map(w => w.passphrase))[0];

describe(".toHaveValidSecondSignature", () => {
  test("passes when given a valid transaction", () => {
    expect(transaction).toHaveValidSecondSignature({
      publicKey: wallets[1].publicKey
    });
  });

  test("fails when given an invalid transaction", () => {
    transaction.secondSignature = "invalid";
    transaction.signSignature = "invalid";

    expect(transaction).not.toHaveValidSecondSignature({
      publicKey: wallets[1].publicKey
    });
  });
});
