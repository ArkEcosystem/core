import { constants } from "../../../crypto";
import { generateTransaction } from "../../src/generators";

const { TRANSACTION_TYPES } = constants;

describe("generateTransactions", () => {
    it("should create transfer transactions for devnet", () => {
        const devnetAddress = "DJQL8LWj81nRJNv9bbUgNXXELcB3q5qjZH";
        const transactions = generateTransaction("devnet", TRANSACTION_TYPES.TRANSFER, undefined, devnetAddress);

        for (const transaction of transactions) {
            expect(transaction).toMatchObject({ recipientId: devnetAddress });
        }
    });
});
