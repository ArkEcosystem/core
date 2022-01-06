import "jest-extended";

import { Interfaces } from "@arkecosystem/core-magistrate-crypto";
import { EntityBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { EntityTransaction } from "@arkecosystem/core-magistrate-crypto/src/transactions";
import { Managers, Transactions, Validation } from "@arkecosystem/crypto";

import { generateAssets, generateSpecialAssets } from "../fixtures/entity/assets/generate";
import { invalidRegisters, unserializableRegisters, validRegisters } from "../fixtures/entity/schemas/register";
import { invalidResigns, unserializableResigns, validResigns } from "../fixtures/entity/schemas/resign";
import { invalidUpdates, unserializableUpdates, validUpdates } from "../fixtures/entity/schemas/update";
import { checkCommonFields } from "../helper";

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

        it.each(entityAssets)("should ser/deserialize giving back original fields", (asset) => {
            const mockVerifySchema = jest
                .spyOn(Transactions.Verifier, "verifySchema")
                .mockImplementation((data) => ({ value: data, error: undefined }));

            const entity = builder.network(23).asset(asset).sign("passphrase").getStruct();

            const serialized = Transactions.TransactionFactory.fromData(entity).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, entity);
            expect(deserialized.data.asset).toEqual(entity.asset);

            mockVerifySchema.mockRestore();
        });

        it.each(entitySpecialAssets)(
            "should ser/deserialize giving back original fields",
            (assetToSerialize, expectedDeserialized) => {
                const mockVerifySchema = jest
                    .spyOn(Transactions.Verifier, "verifySchema")
                    .mockImplementation((data) => ({ value: data, error: undefined }));

                const entity = builder.network(23).asset(assetToSerialize).sign("passphrase").getStruct();

                const serialized = Transactions.TransactionFactory.fromData(entity).serialized.toString("hex");
                const deserialized = Transactions.Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, entity);
                expect(deserialized.data.asset).toEqual(expectedDeserialized);

                mockVerifySchema.mockRestore();
            },
        );

        it.each(
            [...unserializableRegisters, ...unserializableResigns, ...unserializableUpdates].map((asset) => [asset]),
        )("should throw error", (asset: Interfaces.IEntityAsset) => {
            expect(() => {
                builder.asset(asset).sign("passphrase");
            }).toThrowError();
        });
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = EntityTransaction.getSchema();
        });

        it.each([...validRegisters, ...validResigns, ...validUpdates].map((asset) => [asset]))(
            "should not give any validation error",
            (asset: Interfaces.IEntityAsset) => {
                const entityRegistration = builder.asset(asset).sign("passphrase");

                const { error, value } = Validation.validator.validate(
                    transactionSchema,
                    entityRegistration.getStruct(),
                );
                expect(error).toBeUndefined();
                expect(value!.asset).toEqual(asset);
            },
        );

        it.each([...invalidRegisters, ...invalidResigns, ...invalidUpdates].map((asset) => [asset]))(
            "should give validation error",
            (asset: Interfaces.IEntityAsset) => {
                const entity = builder.asset(asset).sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, entity.getStruct());
                expect(error).not.toBeUndefined();
            },
        );
    });
});
