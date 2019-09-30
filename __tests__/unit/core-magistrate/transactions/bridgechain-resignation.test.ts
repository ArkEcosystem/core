import "jest-extended";

import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { checkCommonFields } from "../helper";

let builder: MagistrateBuilders.BridgechainResignationBuilder;

describe("Bridgechain registration transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BridgechainResignationBuilder();
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const bridgechainResignation = builder
                .businessResignationAsset("1")
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(bridgechainResignation).serialized.toString(
                "hex",
            );
            const deserialized = Transactions.deserializer.deserialize(serialized);

            checkCommonFields(deserialized, bridgechainResignation);
        });
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = MagistrateTransactions.BridgechainResignationTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder.businessResignationAsset("1").sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder.businessResignationAsset("1").sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should fail because invalid asset", () => {
            const bridgechainRegistration = builder.businessResignationAsset("a").sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).not.toBeUndefined();
        });
    });
});
