import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessResignationBuilder } from "../../../src/builders";
import { BusinessResignationTransaction } from "../../../src/transactions";

let builder: BusinessResignationBuilder;

describe("Business resignation builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BusinessResignationTransaction);

    beforeEach(() => {
        builder = new BusinessResignationBuilder();
    });

    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder.sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
