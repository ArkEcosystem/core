import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { BusinessUpdateBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessUpdateTransaction } from "@packages/core-magistrate-crypto/src/transactions";

import { businessUpdateAsset1, businessUpdateAsset2, businessUpdateAsset3, checkCommonFields } from "../helper";

let crypto: CryptoSuite.CryptoSuite;
let builder: BusinessUpdateBuilder<any, any, any>;

describe("Business update transaction", () => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
    crypto.CryptoManager.HeightTracker.setHeight(2);

    crypto.TransactionManager.TransactionTools.TransactionRegistry.registerTransactionType(BusinessUpdateTransaction);

    beforeEach(() => {
        builder = new BusinessUpdateBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .businessUpdateAsset(businessUpdateAsset1)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessResignation,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .businessUpdateAsset(businessUpdateAsset2)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessResignation,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .businessUpdateAsset(businessUpdateAsset3)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                businessResignation,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });
    });

    describe("Schema validation", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = BusinessUpdateTransaction.getSchema();
        });

        it("should not throw any error ", () => {
            const businessUpdateBuilder = builder.businessUpdateAsset(businessUpdateAsset1).sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessUpdateBuilder.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error ", () => {
            const businessUpdateBuilder = builder.businessUpdateAsset(businessUpdateAsset2).sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessUpdateBuilder.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error ", () => {
            const businessUpdateBuilder = builder.businessUpdateAsset(businessUpdateAsset3).sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, businessUpdateBuilder.getStruct());
            expect(error).toBeUndefined();
        });
    });
});
