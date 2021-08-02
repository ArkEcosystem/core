import "jest-extended";

import { EntityAction, EntityType } from "@packages/core-magistrate-crypto/src/enums";
import { EntityTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { EntityBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IEntityAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { Managers, Transactions } from "@packages/crypto";

let builder: EntityBuilder;

const entityAsset: IEntityAsset = {
    type: EntityType.Business,
    subType: 0,
    action: EntityAction.Register,
    registrationId: "dummy_registration_id",
    data: {
        name: "dummy_name",
        ipfsData: "dummy_ipfs_data",
    },
};

beforeAll(() => {
    Transactions.TransactionRegistry.registerTransactionType(EntityTransaction);
});

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    builder = new EntityBuilder();
});

describe("Entity builder", () => {
    describe("businessRegistrationAsset", () => {
        it("should set asset", () => {
            expect(builder.asset(entityAsset)).toBe(builder);

            expect(builder.data.asset).toEqual(entityAsset);
        });
    });

    describe("getStruct", () => {
        it("should return struct", () => {
            builder.asset(entityAsset);
            const struct = builder.sign("dummy_passphrase").getStruct();

            expect(struct.asset).toEqual(entityAsset);
        });
    });
});
