import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainResignationBuilder } from "../../../src/builders";
import { BridgechainResignationTransaction } from "../../../src/transactions";

let builder: BridgechainResignationBuilder;

describe("Bridgechain resignation builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new BridgechainResignationBuilder();
    });
    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder
                .businessResignationAsset("127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935")
                .sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
