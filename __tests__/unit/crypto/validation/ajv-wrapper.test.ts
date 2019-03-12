import "jest-extended";

import ajv = require("ajv");
import { configManager } from "../../../../packages/crypto/src/managers/config";
import { TransactionRegistry } from "../../../../packages/crypto/src/transactions/index";
import { TransactionSchema } from "../../../../packages/crypto/src/transactions/types/schemas";
import { AjvWrapper } from "../../../../packages/crypto/src/validation";
import { block2, genesisBlock } from "../../../utils/fixtures/unitnet/blocks";

describe("AjvWrapper", () => {
    describe("validate", () => {
        describe("publicKey", () => {
            it("should be ok", () => {
                expect(
                    AjvWrapper.validate(
                        "publicKey",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
            });

            it("should not be ok", () => {
                expect(
                    AjvWrapper.validate(
                        "publicKey",
                        "Z34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(
                    AjvWrapper.validate(
                        "publicKey",
                        "34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", "").error).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", 1234).error).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", null).error).not.toBeNull();
                expect(AjvWrapper.validate("publicKey", undefined).error).not.toBeNull();
            });
        });

        describe("address", () => {
            it("should be ok", () => {
                expect(AjvWrapper.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(AjvWrapper.validate("address", "€TRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeNull();
                expect(AjvWrapper.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).not.toBeNull();
                expect(
                    AjvWrapper.validate("address", "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeNull();
                expect(AjvWrapper.validate("address", "").error).not.toBeNull();
                expect(AjvWrapper.validate("address", 1234).error).not.toBeNull();
                expect(AjvWrapper.validate("address", null).error).not.toBeNull();
                expect(AjvWrapper.validate("address", undefined).error).not.toBeNull();
            });
        });

        describe("hex", () => {
            it("should be ok", () => {
                expect(AjvWrapper.validate("hex", "deadbeef").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(AjvWrapper.validate("hex", "€").error).not.toBeNull();
                expect(AjvWrapper.validate("hex", 1).error).not.toBeNull();
                expect(AjvWrapper.validate("hex", "").error).not.toBeNull();
                expect(AjvWrapper.validate("hex", null).error).not.toBeNull();
                expect(AjvWrapper.validate("hex", undefined).error).not.toBeNull();
            });
        });

        describe("base58", () => {
            it("should be ok", () => {
                expect(AjvWrapper.validate("base58", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(AjvWrapper.validate("base58", "€").error).not.toBeNull();
                expect(AjvWrapper.validate("base58", 1).error).not.toBeNull();
                expect(AjvWrapper.validate("base58", "").error).not.toBeNull();
                expect(AjvWrapper.validate("base58", null).error).not.toBeNull();
                expect(AjvWrapper.validate("base58", undefined).error).not.toBeNull();
            });
        });

        describe("numericString", () => {
            it("should be ok", () => {
                expect(AjvWrapper.validate("numericString", "1234").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(AjvWrapper.validate("numericString", "+12").error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", ".1").error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", "1.0").error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", "€").error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", 1).error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", "").error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", null).error).not.toBeNull();
                expect(AjvWrapper.validate("numericString", undefined).error).not.toBeNull();
            });
        });

        describe("alphanumeric", () => {
            it("should be ok", () => {
                expect(AjvWrapper.validate("alphanumeric", "abcDE1234").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(AjvWrapper.validate("alphanumeric", "+12").error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", ".1").error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", "1.0").error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", "€").error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", 1).error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", "").error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", null).error).not.toBeNull();
                expect(AjvWrapper.validate("alphanumeric", undefined).error).not.toBeNull();
            });
        });

        describe("transactionId", () => {
            it("should be ok", () => {
                expect(
                    AjvWrapper.validate(
                        "transactionId",
                        "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).toBeNull();
            });

            it("should not be ok", () => {
                expect(
                    AjvWrapper.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).not.toBeNull();
                expect(
                    AjvWrapper.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4111",
                    ).error,
                ).not.toBeNull();
                expect(
                    AjvWrapper.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4@@@",
                    ).error,
                ).not.toBeNull();
                expect(AjvWrapper.validate("transactionId", 1).error).not.toBeNull();
                expect(AjvWrapper.validate("transactionId", "").error).not.toBeNull();
                expect(AjvWrapper.validate("transactionId", null).error).not.toBeNull();
                expect(AjvWrapper.validate("transactionId", undefined).error).not.toBeNull();
            });
        });

        describe("walletVote", () => {
            it("should be ok", () => {
                expect(
                    AjvWrapper.validate(
                        "walletVote",
                        "+034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
                expect(
                    AjvWrapper.validate(
                        "walletVote",
                        "-034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
            });

            it("should not be ok", () => {
                expect(
                    AjvWrapper.validate(
                        "walletVote",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(AjvWrapper.validate("walletVote", "-^sd").error).not.toBeNull();
                expect(AjvWrapper.validate("walletVote", 1234).error).not.toBeNull();
                expect(AjvWrapper.validate("walletVote", "").error).not.toBeNull();
                expect(AjvWrapper.validate("walletVote", null).error).not.toBeNull();
                expect(AjvWrapper.validate("walletVote", undefined).error).not.toBeNull();
            });
        });

        describe("delegateUsername", () => {
            it("should be ok", () => {
                expect(AjvWrapper.validate("delegateUsername", "asdf").error).toBeNull();
                expect(AjvWrapper.validate("delegateUsername", "_").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(AjvWrapper.validate("delegateUsername", "AbCdEfG").error).not.toBeNull();
                expect(AjvWrapper.validate("delegateUsername", "longerthantwentycharacterslong").error).not.toBeNull();
                expect(AjvWrapper.validate("delegateUsername", 1234).error).not.toBeNull();
                expect(AjvWrapper.validate("delegateUsername", "").error).not.toBeNull();
                expect(AjvWrapper.validate("delegateUsername", null).error).not.toBeNull();
                expect(AjvWrapper.validate("delegateUsername", undefined).error).not.toBeNull();
            });
        });

        describe("block", () => {
            beforeAll(() => {
                TransactionRegistry.get(0); // Make sure registry is loaded, since it adds the "transactions" schema.
                configManager.setFromPreset("unitnet");
            });

            it("should be ok", () => {
                expect(AjvWrapper.validate("block", block2).error).toBeNull();
                expect(AjvWrapper.validate("block", genesisBlock).error).toBeNull();
            });

            it("should not be ok", () => {
                block2.numberOfTransactions = 1;
                expect(AjvWrapper.validate("block", block2).error).not.toBeNull();
                block2.numberOfTransactions = 11;
                expect(AjvWrapper.validate("block", block2).error).not.toBeNull();
                block2.numberOfTransactions = 10;
                expect(AjvWrapper.validate("block", block2).error).toBeNull();
            });
        });
    });

    describe("extend", () => {
        it("should extend transaction schema", () => {
            const customTransactionSchema = { $id: "custom" } as TransactionSchema;
            AjvWrapper.extendTransaction(customTransactionSchema);
            expect(AjvWrapper.instance().getSchema("custom")).not.toBeNull();
        });
    });

    describe("instance", () => {
        it("should return the instance", () => {
            expect(AjvWrapper.instance()).toBeInstanceOf(ajv);
        });
    });
});
