import "jest-extended";

import { BusinessRegistrationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IBusinessRegistrationAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { BusinessRegistrationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@packages/crypto";

let builder: BusinessRegistrationBuilder;

const businessRegistrationAsset: IBusinessRegistrationAsset = {
    name: "dummy_name",
    website: "dummy_website",
    vat: "dummy_vat",
    repository: "dummy_repository",
};

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(BusinessRegistrationTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new BusinessRegistrationBuilder();
});

describe("Business registration builder", () => {
    describe("businessRegistrationAsset", () => {
        it("should set asset", () => {
            expect(builder.businessRegistrationAsset(businessRegistrationAsset)).toBe(builder);

            expect(builder.data.asset!.businessRegistration).toEqual(businessRegistrationAsset);
        });

        it("should not set asset if asset is undefined", () => {
            builder.data.asset = undefined;

            expect(builder.businessRegistrationAsset(businessRegistrationAsset)).toBe(builder);

            expect(builder.data.asset).toBeUndefined();
        });

        it("should not set asset if asset.bridgechainRegistration is undefined", () => {
            builder.data.asset!.businessRegistration = undefined;

            expect(builder.businessRegistrationAsset(businessRegistrationAsset)).toBe(builder);

            expect(builder.data.asset!.businessRegistration).toBeUndefined();
        });
    });

    describe("getStruct", () => {
        it("should return struct", () => {
            builder.businessRegistrationAsset(businessRegistrationAsset);
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset!.businessRegistration).toEqual(businessRegistrationAsset);
        });
    });
});
