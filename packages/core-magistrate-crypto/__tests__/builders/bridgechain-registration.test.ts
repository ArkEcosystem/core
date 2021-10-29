import "jest-extended";

import { BridgechainRegistrationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IBridgechainRegistrationAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { BridgechainRegistrationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

let builder: BridgechainRegistrationBuilder;

const bridgechainRegistrationAsset: IBridgechainRegistrationAsset = {
    name: "dummy_name",
    seedNodes: [],
    genesisHash: "dummy_genesis_hash",
    bridgechainRepository: "dummy_repository",
    bridgechainAssetRepository: "dummy_asset_repository",
    ports: {
        port_name: 1234,
    },
};

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(BridgechainRegistrationTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new BridgechainRegistrationBuilder();
});

describe("Bridgechain registration builder", () => {
    describe("bridgechainRegistrationAsset", () => {
        it("should set asset", () => {
            expect(builder.bridgechainRegistrationAsset(bridgechainRegistrationAsset)).toBe(builder);

            expect(builder.data.asset!.bridgechainRegistration).toEqual(bridgechainRegistrationAsset);
        });

        it("should not set asset if asset is undefined", () => {
            builder.data.asset = undefined;

            expect(builder.bridgechainRegistrationAsset(bridgechainRegistrationAsset)).toBe(builder);

            expect(builder.data.asset).toBeUndefined();
        });

        it("should not set asset if asset.bridgechainRegistration is undefined", () => {
            builder.data.asset!.bridgechainRegistration = undefined;

            expect(builder.bridgechainRegistrationAsset(bridgechainRegistrationAsset)).toBe(builder);

            expect(builder.data.asset!.bridgechainRegistration).toBeUndefined();
        });
    });

    describe("getStruct", () => {
        it("should return struct", () => {
            builder.bridgechainRegistrationAsset(bridgechainRegistrationAsset);
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset!.bridgechainRegistration).toEqual(bridgechainRegistrationAsset);
        });
    });
});
