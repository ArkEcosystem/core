import "jest-extended";

import { EntityBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { EntityTransaction } from "@arkecosystem/core-magistrate-crypto/src/transactions";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { checkCommonFields } from "../helper";
import { generateAssets, generateSpecialAssets } from "../fixtures/entity/assets/generate";

let builder: EntityBuilder;

describe("Business update transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(EntityTransaction);

    beforeEach(() => {
        builder = new EntityBuilder();
    });

    describe("Ser/deser", () => {
        const entityAssets = generateAssets();
        const entitySpecialAssets = generateSpecialAssets();

        it.each([entityAssets])("should ser/deserialize giving back original fields", (asset) => {
            const entity = builder
                .network(23)
                .asset(asset)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(entity).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, entity);
            expect(deserialized.data.asset).toEqual(entity.asset);
        });

        it.each([entitySpecialAssets])
        ("should ser/deserialize giving back original fields", ([assetToSerialize, expectedDeserialized]) => {
            const entity = builder
                .network(23)
                .asset(assetToSerialize)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(entity).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, entity);
            expect(deserialized.data.asset).toEqual(expectedDeserialized);
        });
    });
});