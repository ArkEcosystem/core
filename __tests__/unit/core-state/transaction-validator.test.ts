import "jest-extended";

// import { Sandbox } from "@packages/core-test-framework/src";
import { Utils } from "@arkecosystem/core-kernel";
import { TransactionValidator } from "@arkecosystem/core-state/src/transaction-validator";
import { makeVoteTransactions } from "./helper";
import { AssertionError } from "assert";
import { setUp } from "./setup";

let transactionValidator: TransactionValidator;
let applySpy: jest.SpyInstance;

beforeAll(async () => {
    const initialEnv = setUp();
    transactionValidator = initialEnv.transactionValidator;
    applySpy = initialEnv.spies.applySpy;
});

describe("Transaction Validator", () => {
    it("should validate transactions", async () => {        
        const transaction = makeVoteTransactions(
            1, 
            [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]
        );
        await transactionValidator.validate(transaction[0]);

        expect(applySpy).toHaveBeenCalledWith(transaction[0]);
    });

    it("should throw when transaction id doesn't match deserialised", () => {
        const transaction = makeVoteTransactions(
            1, 
            [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]
        );
        const copiedTransaction = (Utils.cloneObject(transaction[0]) as any);
        copiedTransaction.id = "wrong";
        
        expect.assertions(1);
        transactionValidator.validate(copiedTransaction).catch(e => expect(e).toBeInstanceOf(AssertionError));
    });
});