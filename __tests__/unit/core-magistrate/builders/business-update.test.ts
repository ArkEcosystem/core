import "jest-extended";

import {
    Builders as MagistrateBuilders,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions } from "@arkecosystem/crypto";

let builder: MagistrateBuilders.BusinessUpdateBuilder;

describe("Business update builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessUpdateTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BusinessUpdateBuilder();
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
