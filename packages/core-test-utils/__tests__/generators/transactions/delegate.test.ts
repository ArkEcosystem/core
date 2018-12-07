import { delegateRegistration } from "../../../src/generators";
import { constants } from "../../../../crypto";

const { TRANSACTION_TYPES } = constants;

describe("Delegate transaction", () => {
  it("should be a function", () => {
    expect(delegateRegistration).toBeFunction();
  });

  const quantity = 4;
  const transactions = delegateRegistration(undefined, undefined, quantity);

  it("should return an array", () => {
    expect(transactions).toBeArrayOfSize(quantity);
  });

  it("should return an array of 4 delegate objects", () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({
        type: TRANSACTION_TYPES.DELEGATE_REGISTRATION
      });
    }
  });
});
