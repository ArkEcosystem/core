import { constants } from "../../../../../packages/crypto";
import { generateSecondSignature } from "../../../../utils/generators";

const { TransactionTypes } = constants;

describe("Signature transaction", () => {
    const quantity = 4;
    const transactions = generateSecondSignature(undefined, undefined, quantity);

    it("should return an array", () => {
        expect(transactions).toBeArrayOfSize(quantity);
    });

    it("should return an array of 4 signature objects", () => {
        for (const transaction of transactions) {
            expect(transaction).toMatchObject({
                type: TransactionTypes.SecondSignature,
            });
        }
    });
});
