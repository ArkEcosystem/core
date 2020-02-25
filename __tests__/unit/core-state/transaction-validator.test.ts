import "jest-extended";

import { setUp } from "./setup";
import { TransactionValidator } from "@arkecosystem/core-state/src/transaction-validator";
import { makeVoteTransactions } from "./helper";
let transactionValidator: TransactionValidator;
let applySpy: jest.SpyInstance;

beforeAll(async () => {
    const initialEnv = setUp();
    transactionValidator = initialEnv.transactionValidator;
    applySpy = initialEnv.spies.applySpy;
});

describe("Transaction Validator", () => {
    it("should validate transactions", () => {
        const transaction = makeVoteTransactions(
            3, 
            [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]
        );
        transactionValidator.validate(transaction[0]);
        expect(applySpy).toHaveBeenCalledWith(transaction[0]);
    });
});