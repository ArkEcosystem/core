import "jest-extended";

import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { BridgechainResignationBuilder } from "../../../src/builders";
import { BridgechainResignationTransaction } from "../../../src/transactions";
import { checkCommonFields } from "../helper";

let builder: BridgechainResignationBuilder;

describe("Bridgechain registration transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new BridgechainResignationBuilder();
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const bridgechainResignation = builder
                .businessResignationAsset("127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935")
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
            transactionSchema = BridgechainResignationTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder
                .businessResignationAsset("127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935")
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder
                .businessResignationAsset("1af33cec01cac2492f20de1cf103f65882c5da3a7aee7b3583fa6fe68c084174")
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should fail because &#x1F601; inside id", () => {
            const bridgechainRegistration = builder
                .businessResignationAsset("&#x1F601;1cac2492f20de1cf103f65882c5da3a7aee7b3583fa6fe68c084174")
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).not.toBeUndefined();
        });
    });
});
