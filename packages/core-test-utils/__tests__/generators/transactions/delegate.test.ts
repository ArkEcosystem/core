import { constants } from "../../../../crypto";
import { generateDelegateRegistration } from "../../../src/generators";

const { TRANSACTION_TYPES } = constants;

describe("Delegate transaction", () => {
  it("should be a function", () => {
    expect(generateDelegateRegistration).toBeFunction();
  });

  const quantity = 4;
  const transactions = generateDelegateRegistration(
    undefined,
    undefined,
    quantity
  );

  it("should return an array", () => {
    expect(transactions).toBeArrayOfSize(quantity);
  });

  it("should return an array of 4 delegate objects", () => {
    for (const transaction of transactions) {
      expect(transaction).toMatchObject({
        type: TRANSACTION_TYPES.DELEGATE_REGISTRATION
      });
    }
  });
});
