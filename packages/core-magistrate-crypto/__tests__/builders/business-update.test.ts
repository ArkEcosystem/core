import "jest-extended";

import { BusinessUpdateBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IBusinessUpdateAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { BusinessUpdateTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

let builder: BusinessUpdateBuilder;

const businessUpdateAsset: IBusinessUpdateAsset = {
    name: "dummy_name",
    website: "dummy_website",
    vat: "dummy_vat",
    repository: "dummy_repository",
};

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(BusinessUpdateTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new BusinessUpdateBuilder();
});

describe("Business update builder", () => {
    describe("businessUpdateAsset", () => {
        it("should set asset", () => {
            expect(builder.businessUpdateAsset(businessUpdateAsset)).toBe(builder);

            expect(builder.data.asset!.businessUpdate).toEqual(businessUpdateAsset);
        });

        it("should not set asset if asset is undefined", () => {
            builder.data.asset = undefined;

            expect(builder.businessUpdateAsset(businessUpdateAsset)).toBe(builder);

            expect(builder.data.asset).toBeUndefined();
        });

        it("should not set asset if asset.bridgechainRegistration is undefined", () => {
            builder.data.asset!.businessUpdate = undefined;

            expect(builder.businessUpdateAsset(businessUpdateAsset)).toBe(builder);

            expect(builder.data.asset!.businessUpdate).toBeUndefined();
        });
    });

    describe("getStruct", () => {
        it("should return struct", () => {
            builder.businessUpdateAsset(businessUpdateAsset);
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset!.businessUpdate).toEqual(businessUpdateAsset);
        });
    });
});
