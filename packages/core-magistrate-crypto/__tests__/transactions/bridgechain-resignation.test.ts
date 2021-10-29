import "jest-extended";

import { BridgechainResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BridgechainResignationTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions, Validation as Ajv } from "@packages/crypto";

import { checkCommonFields } from "../helper";

const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
let builder: BridgechainResignationBuilder;

describe("Bridgechain registration transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new BridgechainResignationBuilder();
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const bridgechainResignation = builder
                .bridgechainResignationAsset(genesisHash)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(bridgechainResignation).serialized.toString(
                "hex",
            );
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, bridgechainResignation);
        });

        it("should throw on serialization if asset is undefined", () => {
            const bridgechainResignation = builder
                .bridgechainResignationAsset(genesisHash)
                .network(23)
                .sign("passphrase")
                .getStruct();

            const transaction = Transactions.TransactionFactory.fromData(bridgechainResignation);
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
            transactionSchema = BridgechainResignationTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder.bridgechainResignationAsset(genesisHash).sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder.bridgechainResignationAsset(genesisHash).sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should fail because invalid asset", () => {
            const bridgechainRegistration = builder.bridgechainResignationAsset("wrongGenesisHash").sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).not.toBeUndefined();
        });
    });
});
