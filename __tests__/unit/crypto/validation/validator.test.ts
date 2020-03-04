import "jest-extended";

import { Factories, Generators } from "@packages/core-test-framework/src";
import { IBlock, ITransactionData } from "@packages/crypto/src/interfaces";
import { configManager } from "@packages/crypto/src/managers";
import { TransactionTypeFactory } from "@packages/crypto/src/transactions";
import { TransactionSchema } from "@packages/crypto/src/transactions/types/schemas";
import { BigNumber } from "@packages/crypto/src/utils";
import { validator } from "@packages/crypto/src/validation";
import ajv from "ajv";

describe("validator", () => {
    describe("validate", () => {
        describe("transaction", () => {
            const transaction = {
                type: 0,
                amount: BigNumber.make(1000),
                fee: BigNumber.make(2000),
                recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
                asset: {},
                senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            } as ITransactionData;

            it("should expect a timestamp if version = 1 or absent", () => {
                expect(validator.validate("transferSigned", transaction).error).toEqual(
                    "data should have required property '.timestamp'",
                );

                transaction.version = 1;
                expect(validator.validate("transferSigned", transaction).error).toEqual(
                    "data should have required property '.timestamp'",
                );

                transaction.timestamp = 12222;
                expect(validator.validate("transferSigned", transaction).error).toBeUndefined();
            });

            it("should expect a nonce if version = 2 or higher", () => {
                transaction.version = 2;

                expect(validator.validate("transferSigned", transaction).error).toEqual(
                    "data should have required property '.nonce'",
                );

                transaction.nonce = BigNumber.ZERO;
                expect(validator.validate("transferSigned", transaction).error).toBeUndefined();
            });
        });

        describe("transaction ", () => {
            const transaction = {
                type: 0,
                amount: BigNumber.make(1000),
                fee: BigNumber.make(2000),
                recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
                timestamp: 141738,
                asset: {},
                senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                signature:
                    "618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a",
                id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            };

            expect(validator.validate("transferSigned", transaction).error).toBeUndefined();
        });

        describe("publicKey", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "publicKey",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "publicKey",
                        "Z34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeUndefined();
                expect(
                    validator.validate("publicKey", "34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeUndefined();
                expect(validator.validate("publicKey", "").error).not.toBeUndefined();
                expect(validator.validate("publicKey", 1234).error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("publicKey", null).error).not.toBeUndefined();
                expect(validator.validate("publicKey", undefined).error).not.toBeUndefined();
            });
        });

        describe("address", () => {
            it("should be ok", () => {
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("address", "€TRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeUndefined();
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).not.toBeUndefined();
                expect(
                    validator.validate("address", "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeUndefined();
                expect(validator.validate("address", "").error).not.toBeUndefined();
                expect(validator.validate("address", 1234).error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("address", null).error).not.toBeUndefined();
                expect(validator.validate("address", undefined).error).not.toBeUndefined();
            });
        });

        describe("hex", () => {
            it("should be ok", () => {
                expect(validator.validate("hex", "deadbeef").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("hex", "€").error).not.toBeUndefined();
                expect(validator.validate("hex", 1).error).not.toBeUndefined();
                expect(validator.validate("hex", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("hex", null).error).not.toBeUndefined();
                expect(validator.validate("hex", undefined).error).not.toBeUndefined();
            });
        });

        describe("base58", () => {
            it("should be ok", () => {
                expect(validator.validate("base58", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("base58", "€").error).not.toBeUndefined();
                expect(validator.validate("base58", 1).error).not.toBeUndefined();
                expect(validator.validate("base58", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("base58", null).error).not.toBeUndefined();
                expect(validator.validate("base58", undefined).error).not.toBeUndefined();
            });
        });

        describe("alphanumeric", () => {
            it("should be ok", () => {
                expect(validator.validate("alphanumeric", "abcDE1234").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("alphanumeric", "+12").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", ".1").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", "1.0").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", "€").error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", 1).error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("alphanumeric", null).error).not.toBeUndefined();
                expect(validator.validate("alphanumeric", undefined).error).not.toBeUndefined();
            });
        });

        describe("transactionId", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "transactionId",
                        "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).not.toBeUndefined();
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4111",
                    ).error,
                ).not.toBeUndefined();
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4@@@",
                    ).error,
                ).not.toBeUndefined();
                expect(validator.validate("transactionId", 1).error).not.toBeUndefined();
                expect(validator.validate("transactionId", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("transactionId", null).error).not.toBeUndefined();
                expect(validator.validate("transactionId", undefined).error).not.toBeUndefined();
            });
        });

        describe("walletVote", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "walletVote",
                        "+034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeUndefined();
                expect(
                    validator.validate(
                        "walletVote",
                        "-034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "walletVote",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeUndefined();
                expect(validator.validate("walletVote", "-^sd").error).not.toBeUndefined();
                expect(validator.validate("walletVote", 1234).error).not.toBeUndefined();
                expect(validator.validate("walletVote", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("walletVote", null).error).not.toBeUndefined();
                expect(validator.validate("walletVote", undefined).error).not.toBeUndefined();
            });
        });

        describe("delegateUsername", () => {
            it("should be ok", () => {
                expect(validator.validate("delegateUsername", "asdf").error).toBeUndefined();
                expect(validator.validate("delegateUsername", "_").error).toBeUndefined();
            });

            it("should not be ok", () => {
                expect(validator.validate("delegateUsername", "AbCdEfG").error).not.toBeUndefined();
                expect(
                    validator.validate("delegateUsername", "longerthantwentycharacterslong").error,
                ).not.toBeUndefined();
                expect(validator.validate("delegateUsername", 1234).error).not.toBeUndefined();
                expect(validator.validate("delegateUsername", "").error).not.toBeUndefined();
                // tslint:disable-next-line: no-null-keyword
                expect(validator.validate("delegateUsername", null).error).not.toBeUndefined();
                expect(validator.validate("delegateUsername", undefined).error).not.toBeUndefined();
            });
        });

        describe("block", () => {
            beforeAll(() => {
                TransactionTypeFactory.get(0); // Make sure registry is loaded, since it adds the "transactions" schema.

                // todo: completely wrap this into a function to hide the generation and setting of the config?
                configManager.setConfig(Generators.generateCryptoConfigRaw());
            });

            it("should be ok", () => {
                const block: IBlock = Factories.factory("Block")
                    .withOptions({
                        config: configManager.all(),
                        nonce: "0",
                        transactionsCount: 10,
                    })
                    .make();

                expect(validator.validate("block", block.toJson()).error).toBeUndefined();
                expect(validator.validate("block", configManager.get("genesisBlock")).error).toBeUndefined();
            });

            it("should not be ok", () => {
                const block: IBlock = Factories.factory("Block")
                    .withOptions({
                        config: configManager.all(),
                        nonce: "0",
                        transactionsCount: 10,
                    })
                    .make();

                block.data.numberOfTransactions = 1;
                expect(validator.validate("block", block.toJson()).error).not.toBeUndefined();
                block.data.numberOfTransactions = 11;
                expect(validator.validate("block", block.toJson()).error).not.toBeUndefined();
                block.data.numberOfTransactions = 10;
                expect(validator.validate("block", block.toJson()).error).toBeUndefined();
                block.transactions[0] = {} as any;
                expect(validator.validate("block", block).error).not.toBeUndefined();
                block.transactions[0] = 1234 as any;
                expect(validator.validate("block", block).error).not.toBeUndefined();
            });
        });
    });

    describe("extend", () => {
        it("should extend transaction schema", () => {
            const customTransactionSchema = { $id: "custom" } as TransactionSchema;
            validator.extendTransaction(customTransactionSchema);
            expect(validator.getInstance().getSchema("custom")).not.toBeUndefined();
        });
    });

    describe("instance", () => {
        it("should return the instance", () => {
            expect(validator.getInstance()).toBeInstanceOf(ajv);
        });
    });
});
