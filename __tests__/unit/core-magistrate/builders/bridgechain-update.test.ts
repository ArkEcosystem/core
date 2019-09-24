import "jest-extended";

import { BridgechainUpdateBuilder } from "@arkecosystem/core-magistrate-crypto";
import { BridgechainUpdateTransaction } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

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
                    bridgechainId: Utils.BigNumber.ONE,
                    seedNodes: ["192.168.1.0", "131.107.0.89"],
                })
                .sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
