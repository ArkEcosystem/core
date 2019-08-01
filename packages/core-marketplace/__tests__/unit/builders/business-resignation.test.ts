import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessResignationBuilder } from "../../../src/builders";
import { BusinessResignationTransaction } from "../../../src/transactions";

let builder: BusinessResignationBuilder;

describe("Business resignation builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerCustomType(BusinessResignationTransaction);

    beforeEach(() => {
        builder = new BusinessResignationBuilder();
    });

    describe("test", () => {
        it("should test ", () => {
            const actual = builder.sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
