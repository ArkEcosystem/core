import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BridgechainUpdateBuilder } from "../../../../packages/core-marketplace/src/builders";
import { BridgechainUpdateTransaction } from "../../../../packages/core-marketplace/src/transactions";

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
