import "jest-extended";

import {
    Builders as MagistrateBuilders,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions } from "@arkecosystem/crypto";

let builder: MagistrateBuilders.BridgechainUpdateBuilder;

describe("Bridgechain update builder", () => {
    Managers.configManager.setFromPreset("testnet");

    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BridgechainUpdateBuilder();
    });

    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder
                .bridgechainUpdateAsset({
                    bridgechainId: 1,
                    seedNodes: ["192.168.1.0", "131.107.0.89"],
                })
                .sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
