import { constants } from "../../../../packages/crypto";
import { generateTransaction } from "../../../utils/generators";

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
