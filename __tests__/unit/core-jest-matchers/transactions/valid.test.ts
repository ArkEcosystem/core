import { Interfaces, Managers } from "@arkecosystem/crypto";
import "../../../../packages/core-jest-matchers/src/transactions/valid";
import { TransactionFactory } from '../../../helpers/transaction-factory';

let transaction: Interfaces.ITransactionData;

beforeAll(() => {
    Managers.configManager.setFromPreset("testnet");

    transaction = TransactionFactory
        .transfer("AaWAUV5hgDdUnpWHkD1a65AFQBayGgTaFF")
        .withVersion(2)
        .withPassphrase("poet virtual attend winter mushroom near manual dish exact palm siren motion")
        .createOne();
});

describe(".toBeValidTransaction", () => {
    test("passes when given a valid transaction", () => {
        expect(transaction).toBeValidTransaction();
    });

    test("fails when given an invalid transaction", () => {
        transaction.signature = "invalid" as any;
        expect(expect(transaction).toBeValidTransaction).toThrowError("Expected value to be a valid transaction");
    });
});
