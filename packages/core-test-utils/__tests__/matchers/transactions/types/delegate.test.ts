import matcher from "../../../../src/matchers/transactions/types/delegate";
expect.extend(matcher);

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeDelegateType", () => {
  test("passes when given a valid transaction", () => {
    expect({ type: TRANSACTION_TYPES.DELEGATE }).toBeDelegateType();
  });

  test("fails when given an invalid transaction", () => {
    expect({ type: "invalid" }).not.toBeDelegateType();
  });
});
