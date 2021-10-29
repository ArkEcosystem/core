import "jest-extended";

import { BridgechainResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IBridgechainResignationAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { BridgechainResignationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

let builder: BridgechainResignationBuilder;

const bridgechainResignationAsset: IBridgechainResignationAsset = {
    bridgechainId: "dummy_id",
};

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(BridgechainResignationTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new BridgechainResignationBuilder();
});

describe("Bridgechain resignation builder", () => {
    describe("bridgechainResignationAsset", () => {
        it("should set asset", () => {
            expect(builder.bridgechainResignationAsset("dummy_id")).toBe(builder);

            expect(builder.data.asset!.bridgechainResignation).toEqual(bridgechainResignationAsset);
        });

        it("should not set asset if asset is undefined", () => {
            builder.data.asset = undefined;

            expect(builder.bridgechainResignationAsset("dummy_id")).toBe(builder);

            expect(builder.data.asset).toBeUndefined();
        });

        it("should not set asset if asset.bridgechainRegistration is undefined", () => {
            builder.data.asset!.bridgechainResignation = undefined;

            expect(builder.bridgechainResignationAsset("dummy_id")).toBe(builder);

            expect(builder.data.asset!.bridgechainResignation).toBeUndefined();
        });
    });

    describe("getStruct", () => {
        it("should return struct", () => {
            builder.bridgechainResignationAsset("dummy_id");
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset!.bridgechainResignation).toEqual(bridgechainResignationAsset);
        });
    });
});
