import { constants } from "../../../../crypto";
import { generateSecondSignature } from "../../../src/generators";

const { TRANSACTION_TYPES } = constants;

describe("Signature transaction", () => {
    const quantity = 4;
    const transactions = generateSecondSignature(undefined, undefined, quantity);

    it("should return an array", () => {
        expect(transactions).toBeArrayOfSize(quantity);
    });

    it("should return an array of 4 signature objects", () => {
        for (const transaction of transactions) {
            expect(transaction).toMatchObject({
                type: TRANSACTION_TYPES.SECOND_SIGNATURE,
            });
        }
    });
});
