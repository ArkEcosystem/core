import "jest-extended";

import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Interfaces } from "@arkecosystem/core-magistrate-crypto";
import { EntityBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { EntityTransaction } from "@arkecosystem/core-magistrate-crypto/src/transactions";

import { generateAssets, generateSpecialAssets } from "../fixtures/entity/assets/generate";
import { invalidRegisters, validRegisters } from "../fixtures/entity/schemas/register";
import { invalidResigns, validResigns } from "../fixtures/entity/schemas/resign";
import { invalidUpdates, validUpdates } from "../fixtures/entity/schemas/update";
import { checkCommonFields } from "../helper";

let builder: EntityBuilder<any, any, any>;
const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
crypto.CryptoManager.HeightTracker.setHeight(2);

describe("Entity transaction", () => {
    crypto.TransactionManager.TransactionTools.TransactionRegistry.registerTransactionType(EntityTransaction);

    beforeEach(() => {
        builder = new EntityBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );
    });

    describe("Ser/deser", () => {
        const entityAssets = generateAssets();
        const entitySpecialAssets = generateSpecialAssets();

        it.each([entityAssets])("should ser/deserialize giving back original fields", (asset) => {
            const mockVerifySchema = jest
                .spyOn(crypto.TransactionManager.TransactionTools.Verifier, "verifySchema")
                .mockImplementation((data) => ({ value: data, error: undefined }));

            const entity = builder.asset(asset).sign("passphrase").getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(entity).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, entity);
            expect(deserialized.data.asset).toEqual(entity.asset);

            mockVerifySchema.mockRestore();
        });

        it.each([entitySpecialAssets])(
            "should ser/deserialize giving back original fields",
            ([assetToSerialize, expectedDeserialized]) => {
                const entity = builder.asset(assetToSerialize).sign("passphrase").getStruct();

                const serialized = crypto.TransactionManager.TransactionFactory.fromData(entity).serialized.toString(
                    "hex",
                );
                const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, entity);
                expect(deserialized.data.asset).toEqual(expectedDeserialized);
            },
        );
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

                const { error, value } = crypto.Validator.validate(transactionSchema, entityRegistration.getStruct());
                expect(error).toBeUndefined();
                expect(value.asset).toEqual(asset);
            },
        );

        it.each([...invalidRegisters, ...invalidResigns, ...invalidUpdates].map((asset) => [asset]))(
            "should give validation error",
            (asset: Interfaces.IEntityAsset) => {
                const entityRegistration = builder.asset(asset).sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, entityRegistration.getStruct());
                expect(error).not.toBeUndefined();
            },
        );
    });
});
