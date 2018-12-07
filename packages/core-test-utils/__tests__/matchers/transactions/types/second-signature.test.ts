import matcher from "../../../../src/matchers/transactions/types/second-signature";
expect.extend(matcher);

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeSecondSignatureType", () => {
  test("passes when given a valid transaction", () => {
    expect({
      type: TRANSACTION_TYPES.SECOND_SIGNATURE
    }).toBeSecondSignatureType();
  });

  test("fails when given an invalid transaction", () => {
    expect({ type: "invalid" }).not.toBeSecondSignatureType();
  });
});
