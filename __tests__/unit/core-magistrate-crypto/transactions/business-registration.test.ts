import "jest-extended";

import { BusinessRegistrationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessRegistrationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions, Validation as Ajv } from "@packages/crypto";

import {
    businessRegistrationAsset1,
    businessRegistrationAsset2,
    businessRegistrationAsset3,
    businessRegistrationAsset4,
    checkCommonFields,
} from "../helper";

let builder: BusinessRegistrationBuilder;

describe("Business registration transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(BusinessRegistrationTransaction);

    beforeEach(() => {
        builder = new BusinessRegistrationBuilder();
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized =
                Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset1);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset2)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized =
                Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset2);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset3)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized =
                Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset3);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset4)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized =
                Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset4);
        });

        it("should throw on serialization if asset is undefined", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset4)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const transaction = Transactions.TransactionFactory.fromData(businessRegistration);
            expect(transaction.serialize()).toBeDefined();

            transaction.data.asset = undefined;

            expect(() => {
                transaction.serialize();
            }).toThrowError();
        });
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = BusinessRegistrationTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset2)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset3)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset4)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        describe("should test edge cases for name", () => {
            it("should fail duo to empty string (at least one char)", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "",
                        website: "https://www.google.com",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because max length is 40 char", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "a".repeat(41),
                        website: "https://www.google.com",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("should test edge cases for website", () => {
            it("should fail due to invalid uri", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "business",
                        website: "somewebsite.com",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail due to website length being too long (max 80 chars)", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "business",
                        website: "http://" + "w".repeat(81),
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("should test edge cases for vat", () => {
            it("should fail because vat min length is 8 chars", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "google",
                        website: "https://www.google.com",
                        vat: "1234567",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because vat max length is 15", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "google",
                        website: "https://www.google.com",
                        vat: "1".repeat(16),
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("should test edge cases for repository", () => {
            it("should fail due to invalid uri", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "ark",
                        website: "https://ark.io",
                        repository: "my-awesome-repo.com",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because max repository length is 80", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "ark",
                        website: "https://ark.io",
                        repository: "http://" + "a".repeat(81),
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });
    });
});
