import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { BridgechainResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BridgechainResignationTransaction } from "@packages/core-magistrate-crypto/src/transactions";

import { checkCommonFields } from "../helper";

let crypto: CryptoSuite.CryptoSuite;
const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
let builder: BridgechainResignationBuilder<any, any, any>;

describe("Bridgechain registration transaction", () => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
    crypto.CryptoManager.HeightTracker.setHeight(2);

    crypto.TransactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
        BridgechainResignationTransaction,
    );

    beforeEach(() => {
        builder = new BridgechainResignationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const bridgechainResignation = builder
                .bridgechainResignationAsset(genesisHash)
                .sign("passphrase")
                .getStruct();

            const serialized = crypto.TransactionManager.TransactionFactory.fromData(
                bridgechainResignation,
            ).serialized.toString("hex");
            const deserialized = crypto.TransactionManager.TransactionTools.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, bridgechainResignation);
        });
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = BridgechainResignationTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder.bridgechainResignationAsset(genesisHash).sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should not throw any error", () => {
            const bridgechainRegistration = builder.bridgechainResignationAsset(genesisHash).sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).toBeUndefined();
        });

        it("should fail because invalid asset", () => {
            const bridgechainRegistration = builder.bridgechainResignationAsset("wrongGenesisHash").sign("passphrase");

            const { error } = crypto.Validator.validate(transactionSchema, bridgechainRegistration.getStruct());
            expect(error).not.toBeUndefined();
        });
    });
});
