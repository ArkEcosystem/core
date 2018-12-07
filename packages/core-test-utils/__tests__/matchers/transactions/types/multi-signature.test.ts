import matcher from "../../../../src/matchers/transactions/types/multi-signature";
expect.extend(matcher);

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeMultiSignatureType", () => {
  test("passes when given a valid transaction", () => {
    expect({
      type: TRANSACTION_TYPES.MULTI_SIGNATURE
    }).toBeMultiSignatureType();
  });

  test("fails when given an invalid transaction", () => {
    expect({ type: "invalid" }).not.toBeMultiSignatureType();
  });
});
