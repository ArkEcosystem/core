import { generateVote } from "../../../src/generators";
import { constants } from "../../../../crypto";

const { TRANSACTION_TYPES } = constants;

describe("Vote transaction", () => {
  it("should be a function", () => {
    expect(generateVote).toBeFunction();
  });

  const quantity = 4;
  const transactions = generateVote(undefined, undefined, undefined, quantity);

  it("should return an array", () => {
    expect(transactions).toBeArrayOfSize(quantity);
  });

  it("should return an array of 4 vote objects", () => {
    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ type: TRANSACTION_TYPES.VOTE });
    }
  });
});
