import { constants } from "../../../../packages/crypto";
import { generateTransaction } from "../../../../packages/core-test-utils/src/generators";

const { TransactionTypes } = constants;

describe("generateTransactions", () => {
    it("should create transfer transactions for devnet", () => {
        const devnetAddress = "DJQL8LWj81nRJNv9bbUgNXXELcB3q5qjZH";
        const transactions = generateTransaction("devnet", TransactionTypes.Transfer, undefined, devnetAddress);

        for (const transaction of transactions) {
            expect(transaction).toMatchObject({ recipientId: devnetAddress });
        }
    });
});
