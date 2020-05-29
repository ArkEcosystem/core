import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Utils } from "@packages/core-kernel/src";
import { TransactionValidator } from "@packages/core-state/src/transaction-validator";
import { AssertionError } from "assert";

import { makeVoteTransactions } from "./__utils__/make-vote-transactions";
import { setUp } from "./setup";

let transactionValidator: TransactionValidator;
let applySpy: jest.SpyInstance;

let crypto: CryptoSuite.CryptoSuite;

beforeAll(async () => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

    const initialEnv = await setUp(crypto);
    transactionValidator = initialEnv.transactionValidator;
    applySpy = initialEnv.spies.applySpy;
});

afterAll(() => jest.clearAllMocks());

describe("Transaction Validator", () => {
    it("should validate transactions", async () => {
        const transaction = makeVoteTransactions(
            1,
            [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`],
            crypto,
        );

        await transactionValidator.validate(transaction[0]);

        expect(applySpy).toHaveBeenCalledWith(transaction[0]);
    });

    it("should throw when transaction id doesn't match deserialised", () => {
        const transaction = makeVoteTransactions(
            1,
            [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`],
            crypto,
        );
        const copiedTransaction = Utils.cloneObject(transaction[0]) as any;
        copiedTransaction.id = "wrong";

        expect.assertions(1);
        transactionValidator.validate(copiedTransaction).catch((e) => expect(e).toBeInstanceOf(AssertionError));
    });
});
