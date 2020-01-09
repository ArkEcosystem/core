import "jest-extended";

import { Builders as MagistrateBuilders } from "@arkecosystem/core-magistrate-crypto";
import { Managers, Transactions, Validation } from "@arkecosystem/crypto";
import { BridgechainUpdateTransaction } from "../../../../packages/core-magistrate-crypto/src/transactions";
import { bridgechainUpdateAsset1, checkCommonFields } from "../helper";

const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
let builder: MagistrateBuilders.BridgechainUpdateBuilder;

Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

describe("Bridgechain update ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");

    Transactions.TransactionRegistry.registerTransactionType(BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new MagistrateBuilders.BridgechainUpdateBuilder();
    });

    it("should ser/deserialize giving back original fields", () => {
        const bridgechainUpdate = builder
            .network(23)
            .bridgechainUpdateAsset({
                bridgechainId: genesisHash,
                seedNodes: ["74.125.224.72"],
                ports: { "@arkecosystem/core-api": 12345 },
                bridgechainRepository: "http://github.com/bridgechain/repo",
                bridgechainAssetRepository: "http://github.com/bridgechain/assetrepo",
            })
            .sign("passphrase")
            .getStruct();

        const serialized = Transactions.TransactionFactory.fromData(bridgechainUpdate).serialized.toString("hex");
        const deserialized = Transactions.Deserializer.deserialize(serialized);

        checkCommonFields(deserialized, bridgechainUpdate);
        expect(deserialized.data.asset).toEqual(bridgechainUpdate.asset);
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = BridgechainUpdateTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const bridgechainUpdate = builder.bridgechainUpdateAsset(bridgechainUpdateAsset1).sign("passphrase");

            const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
            expect(error).toBeUndefined();
        });

        describe("seedNodes field", () => {
            it("should have at least one item (ip)", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        seedNodes: [],
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should not accept duplicates", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        seedNodes: ["66.102.0.0", "66.102.0.0"],
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should not accept localhost", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        seedNodes: ["66.102.0.0", "66.102.0.0"],
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("ports field", () => {
            it("should fail with less than 1 property", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        ports: {},
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail with more than 1 property", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        ports: { name1: 1, name2: 2 },
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail if property does not match pattern", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        ports: { "not-valid": 1 },
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should pass if property does match pattern", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        ports: { "@arkecosystem/core-api": 12345 },
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).toBeUndefined();
            });
        });

        describe("bridgechainRepository field", () => {
            it("should not accept empty repository", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        bridgechainRepository: "",
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should not accept invalid uri repository", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        bridgechainRepository: "invalid-uri",
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });
        });

        describe("bridgechainAssetRepository field", () => {
            it("should not accept empty repository", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        bridgechainAssetRepository: "",
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should not accept invalid uri repository", () => {
                const bridgechainUpdate = builder
                    .bridgechainUpdateAsset({
                        bridgechainId: genesisHash,
                        bridgechainAssetRepository: "invalid-uri",
                    })
                    .sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
                expect(error).not.toBeUndefined();
            });
        });
    });
});
