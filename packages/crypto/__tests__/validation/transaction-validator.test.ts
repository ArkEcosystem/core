import "jest-extended";
import { transactionValidator } from "../../src/validation";

describe("Validators - Transaction", () => {
    it("should be instantiated", () => {
        expect(transactionValidator.constructor.name).toBe("TransactionValidator");
    });

    it("should have validate function", () => {
        expect(transactionValidator.validate).toBeFunction();
    });
});
