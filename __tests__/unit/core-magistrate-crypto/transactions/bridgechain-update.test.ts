import "jest-extended";

import { BridgechainUpdateBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BridgechainUpdateTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import { Managers, Transactions, Validation } from "@packages/crypto";

import { bridgechainUpdateAsset1, checkCommonFields } from "../helper";

const genesisHash = "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61";
let builder: BridgechainUpdateBuilder;

describe("Bridgechain update ser/deser", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(BridgechainUpdateTransaction);

    beforeEach(() => {
        builder = new BridgechainUpdateBuilder();
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize giving back original fields", () => {
            const businessResignation = builder
                .network(23)
                .bridgechainUpdateAsset({
                    bridgechainId: genesisHash,
                    seedNodes: ["74.125.224.72"],
                    ports: { "@arkecosystem/core-api": 12345 },
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                })
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(businessResignation).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, businessResignation);
        });

        it("should ser/deserialize if fiends have length 0", () => {
            const businessResignation = builder
                .network(23)
                .bridgechainUpdateAsset({
                    bridgechainId: genesisHash,
                    seedNodes: ["74.125.224.72"],
                    ports: { "@arkecosystem/core-api": 12345 },
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                })
                .sign("passphrase")
                .getStruct();

            const transaction = Transactions.TransactionFactory.fromData(businessResignation);

            transaction.data.asset!.seedNodes = [];
            transaction.data.asset!.ports = {};
            transaction.data.asset!.bridgechainRepository = "";
            transaction.data.asset!.bridgechainAssetRepository = "";

            const serialized = transaction.serialize()!;
            serialized.reset();
            transaction.deserialize(serialized);
        });

        it("should throw on serialization if asset is undefined", () => {
            const businessResignation = builder
                .network(23)
                .bridgechainUpdateAsset({
                    bridgechainId: genesisHash,
                    seedNodes: ["74.125.224.72"],
                    ports: { "@arkecosystem/core-api": 12345 },
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
                })
                .sign("passphrase")
                .getStruct();

            const transaction = Transactions.TransactionFactory.fromData(businessResignation);
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
            transactionSchema = BridgechainUpdateTransaction.getSchema();
        });

        it("should not throw any error", () => {
            const bridgechainUpdate = builder.bridgechainUpdateAsset(bridgechainUpdateAsset1).sign("passphrase");

            const { error } = Validation.validator.validate(transactionSchema, bridgechainUpdate.getStruct());
            expect(error).toBeUndefined();
        });

        describe("should test edge cases for seedNodes", () => {
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

        describe("should test edge cases for ports", () => {
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
    });
});
