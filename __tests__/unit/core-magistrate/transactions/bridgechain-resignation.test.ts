import "jest-extended";

import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { checkCommonFields } from "../helper";

const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
let builder: MagistrateBuilders.BridgechainResignationBuilder;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Bridgechain registration transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(MagistrateTransactions.BridgechainResignationTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BridgechainResignationBuilder();
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
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = MagistrateTransactions.BridgechainResignationTransaction.getSchema();
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
