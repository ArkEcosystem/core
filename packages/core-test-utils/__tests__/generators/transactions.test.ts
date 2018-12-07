import { transaction } from "../../src/generators";
import { constants } from "../../../crypto";

const { TRANSACTION_TYPES } = constants;

describe("generateTransactions", () => {
  it("should be a function", () => {
    expect(transaction).toBeFunction();
  });

  it("should create transfer transactions for devnet", () => {
    const devnetAddress = "DJQL8LWj81nRJNv9bbUgNXXELcB3q5qjZH";
    const transactions = transaction(
      "devnet",
      TRANSACTION_TYPES.TRANSFER,
      undefined,
      devnetAddress
    );

    for (let i = 0; i < transactions.length; i++) {
      expect(transactions[i]).toMatchObject({ recipientId: devnetAddress });
    }
  });
});
