import { constants } from "../../../../crypto";
import { generateVote } from "../../../src/generators";

const { TransactionTypes } = constants;

describe("Vote transaction", () => {
    const quantity = 4;
    const transactions = generateVote(undefined, undefined, undefined, quantity);

    it("should return an array", () => {
        expect(transactions).toBeArrayOfSize(quantity);
    });

    it("should return an array of 4 vote objects", () => {
        for (const transaction of transactions) {
            expect(transaction.data).toMatchObject({ type: TransactionTypes.Vote });
        }
    });
});
