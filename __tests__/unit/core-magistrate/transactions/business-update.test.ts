import "jest-extended";

import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { businessUpdateAsset1, businessUpdateAsset2, businessUpdateAsset3, checkCommonFields } from "../helper";

let builder: MagistrateBuilders.BusinessUpdateBuilder;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Business update transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BusinessUpdateTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BusinessUpdateBuilder();
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .network(23)
                .businessUpdateAsset(businessUpdateAsset1)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .network(23)
                .businessUpdateAsset(businessUpdateAsset2)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .network(23)
                .businessUpdateAsset(businessUpdateAsset3)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });
    });

    describe("Schema validation", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = MagistrateTransactions.BusinessUpdateTransaction.getSchema();
        });

        it("should not throw any error ", () => {
            const businessUpdateBuilder = builder
                .businessUpdateAsset(businessUpdateAsset1)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessUpdateBuilder.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error ", () => {
            const businessUpdateBuilder = builder
                .businessUpdateAsset(businessUpdateAsset2)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessUpdateBuilder.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error ", () => {
            const businessUpdateBuilder = builder
                .businessUpdateAsset(businessUpdateAsset3)
                .network(23)
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessUpdateBuilder.getStruct());
            expect(error).toBeUndefined();
        });
    });
});
