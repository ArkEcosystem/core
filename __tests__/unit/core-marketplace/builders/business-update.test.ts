import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessUpdateBuilder } from "../../../../packages/core-marketplace/src/builders";
import { BusinessUpdateTransaction } from "../../../../packages/core-marketplace/src/transactions";

let builder: BusinessUpdateBuilder;

describe("Business update builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BusinessUpdateTransaction);

    beforeEach(() => {
        builder = new BusinessUpdateBuilder();
    });

    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder
                .businessUpdateAsset({
                    name: "ark",
                })
                .sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
