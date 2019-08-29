import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainResignationBuilder } from "../../../../packages/core-marketplace/src/builders";
import { BridgechainResignationTransaction } from "../../../../packages/core-marketplace/src/transactions";

let builder: BridgechainResignationBuilder;

describe("Bridgechain resignation builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new BridgechainResignationBuilder();
    });
    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder.businessResignationAsset("1").sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
