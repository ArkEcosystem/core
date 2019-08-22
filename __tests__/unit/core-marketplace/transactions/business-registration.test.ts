import "jest-extended";

import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { BusinessRegistrationBuilder } from "../../../src/builders";
import { BusinessRegistrationTransaction } from "../../../src/transactions";
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

            const serialized = Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString(
                "hex",
            );
            const deserialized = Transactions.deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset.businessRegistration).toStrictEqual(businessRegistrationAsset1);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset2)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString(
                "hex",
            );
            const deserialized = Transactions.deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset.businessRegistration).toStrictEqual(businessRegistrationAsset2);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset3)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString(
                "hex",
            );
            const deserialized = Transactions.deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset.businessRegistration).toStrictEqual(businessRegistrationAsset3);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset4)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessRegistration).serialized.toString(
                "hex",
            );
            const deserialized = Transactions.deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset.businessRegistration).toStrictEqual(businessRegistrationAsset4);
        });
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = BusinessRegistrationTransaction.getSchema();
        });

        it("should not throw any error ", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error ", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset2)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error ", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset3)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error ", () => {
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
                        website: "www.google.com",
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
                        website: "www.google.com",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("should test edge cases for website", () => {
            it("should fail duo to website length to short (at least 4 chars)", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "business",
                        website: "a.a",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail duo to website length to long (max 50 chars)", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "business",
                        website: "w".repeat(51),
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
                        website: "www.google.com",
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
                        website: "www.google.com",
                        vat: "1".repeat(16),
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("should test edge cases for repository", () => {
            it("should fail because max repository length is 50", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "ark",
                        website: "ark.io",
                        repository: "a".repeat(51),
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });
    });
});
