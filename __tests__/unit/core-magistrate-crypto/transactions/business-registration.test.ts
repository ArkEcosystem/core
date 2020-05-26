import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { BusinessRegistrationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessRegistrationTransaction } from "@packages/core-magistrate-crypto/src/transactions";

import {
    businessRegistrationAsset1,
    businessRegistrationAsset2,
    businessRegistrationAsset3,
    businessRegistrationAsset4,
    checkCommonFields,
} from "../helper";
let crypto: CryptoSuite.CryptoSuite;
let builder: BusinessRegistrationBuilder<any, any, any>;

describe("Business registration transaction", () => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
    crypto.CryptoManager.HeightTracker.setHeight(2);

    crypto.TransactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        BusinessRegistrationTransaction,
    );

    beforeEach(() => {
        builder = new BusinessRegistrationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset1)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessRegistration,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset1);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset2)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessRegistration,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset2);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset3)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessRegistration,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset3);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset4)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessRegistration,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessRegistration);

            expect(deserialized.data.asset!.businessRegistration).toStrictEqual(businessRegistrationAsset4);
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
                .sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error ", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset2)

                .sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error ", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset3)

                .sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        it("should not throw any error ", () => {
            const businessRegistration = builder
                .businessRegistrationAsset(businessRegistrationAsset4)

                .sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        describe("should test edge cases for name", () => {
            it("should fail duo to empty string (at least one char)", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "",
                        website: "https://www.google.com",
                    })
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because max length is 40 char", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "a".repeat(41),
                        website: "https://www.google.com",
                    })
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
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

                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail due to website length being too long (max 80 chars)", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "business",
                        website: "http://" + "w".repeat(81),
                    })
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
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
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because vat max length is 15", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "google",
                        website: "https://www.google.com",
                        vat: "1".repeat(16),
                    })
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
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
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because max repository length is 80", () => {
                const businessRegistration = builder
                    .businessRegistrationAsset({
                        name: "ark",
                        website: "https://ark.io",
                        repository: "http://" + "a".repeat(81),
                    })
                    .sign("passphrase");

                const { error } = crypto.Validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });
    });
});
