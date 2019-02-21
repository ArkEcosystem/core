import { constants } from "../../../../crypto";
import { generateDelegateRegistration } from "../../../src/generators";

const { TransactionTypes } = constants;

describe("Delegate transaction", () => {
    const quantity = 4;
    const transactions = generateDelegateRegistration(undefined, undefined, quantity);

    it("should return an array", () => {
        expect(transactions).toBeArrayOfSize(quantity);
    });

    it("should return an array of 4 delegate objects", () => {
        for (const transaction of transactions) {
            expect(transaction.data).toMatchObject({
                type: TransactionTypes.DelegateRegistration,
            });
        }
    });
});
