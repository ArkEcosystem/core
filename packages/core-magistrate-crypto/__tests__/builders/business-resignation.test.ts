import "jest-extended";

import { BusinessResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessResignationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

let builder: BusinessResignationBuilder;

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(BusinessResignationTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new BusinessResignationBuilder();
});

describe("Business resignation builder", () => {
    describe("getStruct", () => {
        it("should return struct", () => {
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset!.businessResignation).toEqual({});
        });
    });
});
