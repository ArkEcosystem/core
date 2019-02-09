import { constants } from "../../../../crypto";
import { generateSecondSignature } from "../../../src/generators";

const { TransactionTypes } = constants;

describe("Signature transaction", () => {
    const quantity = 4;
    const transactions = generateSecondSignature(undefined, undefined, quantity);

    it("should return an array", () => {
        expect(transactions).toBeArrayOfSize(quantity);
    });

    it("should return an array of 4 signature objects", () => {
        for (const transaction of transactions) {
            expect(transaction.data).toMatchObject({
                type: TransactionTypes.SecondSignature,
            });
        }
    });
});
