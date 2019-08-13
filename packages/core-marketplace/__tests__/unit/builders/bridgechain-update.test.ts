import "jest-extended";

import { Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainUpdateBuilder } from "../../../src/builders";
import { BridgechainUpdateTransaction } from "../../../src/transactions";

let builder: BridgechainUpdateBuilder;

describe("Bridgechain update builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new BridgechainUpdateBuilder();
    });

    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder
                .bridgechainUpdateAsset({
                    registeredBridgechainId: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    seedNodes: ["1.2.3.4", "127.0.0.1", "192.168.1.0", "131.107.0.89"],
                })
                .sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
