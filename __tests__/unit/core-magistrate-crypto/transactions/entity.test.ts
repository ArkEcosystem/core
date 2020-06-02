import "jest-extended";

import { EntityBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { EntityTransaction } from "@arkecosystem/core-magistrate-crypto/src/transactions";
import { Managers, Transactions, Validation } from "@arkecosystem/crypto";

import { checkCommonFields } from "../helper";
import { generateAssets, generateSpecialAssets } from "../fixtures/entity/assets/generate";
import { validRegisters, invalidRegisters } from "../fixtures/entity/schemas/register";
import { validResigns, invalidResigns } from "../fixtures/entity/schemas/resign";
import { validUpdates, invalidUpdates } from "../fixtures/entity/schemas/update";

let builder: EntityBuilder;

describe("Entity transaction", () => {
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
            const mockVerifySchema = jest.spyOn(Transactions.Verifier, "verifySchema").mockImplementation(
                (data) => ({ value: data, error: undefined })
            );

            const entity = builder
                .network(23)
                .asset(asset)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(entity).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, entity);
            expect(deserialized.data.asset).toEqual(entity.asset);

            mockVerifySchema.mockRestore();
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

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = EntityTransaction.getSchema();
        });

        it.each([[...validRegisters, ...validResigns, ...validUpdates]])("should not give any validation error", (asset) => {
            const entityRegistration = builder
                .asset(asset)
                .sign("passphrase");

            const { error } = Validation.validator.validate(transactionSchema, entityRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it.each([[...invalidRegisters, ...invalidResigns, ...invalidUpdates]])("should give validation error", (asset) => {
            const entityRegistration = builder
                .asset(asset)
                .sign("passphrase");

            const { error } = Validation.validator.validate(transactionSchema, entityRegistration.getStruct());
            expect(error).not.toBeUndefined();
        });
    });
});