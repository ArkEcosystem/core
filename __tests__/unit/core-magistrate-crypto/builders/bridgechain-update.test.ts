import "jest-extended";

import { BridgechainUpdateBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IBridgechainUpdateAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { BridgechainUpdateTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

let builder: BridgechainUpdateBuilder;

const bridgechainUpdateAsset: IBridgechainUpdateAsset = {
    bridgechainId: "dummy_id",
    seedNodes: [],
    ports: {
        dummy_port: 1234,
    },
    bridgechainRepository: "dummy_repository",
    bridgechainAssetRepository: "dummy_asset_repository",
};

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(BridgechainUpdateTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new BridgechainUpdateBuilder();
});

describe("Bridgechain update builder", () => {
    describe("bridgechainUpdateAsset", () => {
        it("should set asset", () => {
            expect(builder.bridgechainUpdateAsset(bridgechainUpdateAsset)).toBe(builder);

            expect(builder.data.asset!.bridgechainUpdate).toEqual(bridgechainUpdateAsset);
        });

        it("should not set asset if asset is undefined", () => {
            builder.data.asset = undefined;

            expect(builder.bridgechainUpdateAsset(bridgechainUpdateAsset)).toBe(builder);

            expect(builder.data.asset).toBeUndefined();
        });

        it("should not set asset if asset.bridgechainRegistration is undefined", () => {
            builder.data.asset!.bridgechainUpdate = undefined;

            expect(builder.bridgechainUpdateAsset(bridgechainUpdateAsset)).toBe(builder);

            expect(builder.data.asset!.bridgechainUpdate).toBeUndefined();
        });
    });

    describe("getStruct", () => {
        it("should return struct", () => {
            builder.bridgechainUpdateAsset(bridgechainUpdateAsset);
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset!.bridgechainUpdate).toEqual(bridgechainUpdateAsset);
        });
    });
});
