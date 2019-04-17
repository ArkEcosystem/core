import "jest-extended";

import ajv from "ajv";
import { configManager } from "../../../../packages/crypto/src/managers";
import { TransactionTypeFactory } from "../../../../packages/crypto/src/transactions";
import { TransactionSchema } from "../../../../packages/crypto/src/transactions/types/schemas";
import { validator } from "../../../../packages/crypto/src/validation";
import { block2, genesisBlock } from "../../../utils/fixtures/unitnet/blocks";

describe("validator", () => {
    describe("validate", () => {
        describe("publicKey", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "publicKey",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "publicKey",
                        "Z34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(
                    validator.validate("publicKey", "34da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeNull();
                expect(validator.validate("publicKey", "").error).not.toBeNull();
                expect(validator.validate("publicKey", 1234).error).not.toBeNull();
                expect(validator.validate("publicKey", null).error).not.toBeNull();
                expect(validator.validate("publicKey", undefined).error).not.toBeNull();
            });
        });

        describe("address", () => {
            it("should be ok", () => {
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).toBeNull();
            });

            it("should not validate if address is not on the same network", () => {
                configManager.setFromPreset("unitnet");
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeNull();
            });

            it("should not be ok", () => {
                expect(validator.validate("address", "€TRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh").error).not.toBeNull();
                expect(validator.validate("address", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).not.toBeNull();
                expect(
                    validator.validate("address", "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126")
                        .error,
                ).not.toBeNull();
                expect(validator.validate("address", "").error).not.toBeNull();
                expect(validator.validate("address", 1234).error).not.toBeNull();
                expect(validator.validate("address", null).error).not.toBeNull();
                expect(validator.validate("address", undefined).error).not.toBeNull();
            });
        });

        describe("hex", () => {
            it("should be ok", () => {
                expect(validator.validate("hex", "deadbeef").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(validator.validate("hex", "€").error).not.toBeNull();
                expect(validator.validate("hex", 1).error).not.toBeNull();
                expect(validator.validate("hex", "").error).not.toBeNull();
                expect(validator.validate("hex", null).error).not.toBeNull();
                expect(validator.validate("hex", undefined).error).not.toBeNull();
            });
        });

        describe("base58", () => {
            it("should be ok", () => {
                expect(validator.validate("base58", "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(validator.validate("base58", "€").error).not.toBeNull();
                expect(validator.validate("base58", 1).error).not.toBeNull();
                expect(validator.validate("base58", "").error).not.toBeNull();
                expect(validator.validate("base58", null).error).not.toBeNull();
                expect(validator.validate("base58", undefined).error).not.toBeNull();
            });
        });

        describe("alphanumeric", () => {
            it("should be ok", () => {
                expect(validator.validate("alphanumeric", "abcDE1234").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(validator.validate("alphanumeric", "+12").error).not.toBeNull();
                expect(validator.validate("alphanumeric", ".1").error).not.toBeNull();
                expect(validator.validate("alphanumeric", "1.0").error).not.toBeNull();
                expect(validator.validate("alphanumeric", "€").error).not.toBeNull();
                expect(validator.validate("alphanumeric", 1).error).not.toBeNull();
                expect(validator.validate("alphanumeric", "").error).not.toBeNull();
                expect(validator.validate("alphanumeric", null).error).not.toBeNull();
                expect(validator.validate("alphanumeric", undefined).error).not.toBeNull();
            });
        });

        describe("transactionId", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "transactionId",
                        "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).toBeNull();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
                    ).error,
                ).not.toBeNull();
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4111",
                    ).error,
                ).not.toBeNull();
                expect(
                    validator.validate(
                        "transactionId",
                        "94c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4@@@",
                    ).error,
                ).not.toBeNull();
                expect(validator.validate("transactionId", 1).error).not.toBeNull();
                expect(validator.validate("transactionId", "").error).not.toBeNull();
                expect(validator.validate("transactionId", null).error).not.toBeNull();
                expect(validator.validate("transactionId", undefined).error).not.toBeNull();
            });
        });

        describe("walletVote", () => {
            it("should be ok", () => {
                expect(
                    validator.validate(
                        "walletVote",
                        "+034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
                expect(
                    validator.validate(
                        "walletVote",
                        "-034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).toBeNull();
            });

            it("should not be ok", () => {
                expect(
                    validator.validate(
                        "walletVote",
                        "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
                    ).error,
                ).not.toBeNull();
                expect(validator.validate("walletVote", "-^sd").error).not.toBeNull();
                expect(validator.validate("walletVote", 1234).error).not.toBeNull();
                expect(validator.validate("walletVote", "").error).not.toBeNull();
                expect(validator.validate("walletVote", null).error).not.toBeNull();
                expect(validator.validate("walletVote", undefined).error).not.toBeNull();
            });
        });

        describe("delegateUsername", () => {
            it("should be ok", () => {
                expect(validator.validate("delegateUsername", "asdf").error).toBeNull();
                expect(validator.validate("delegateUsername", "_").error).toBeNull();
            });

            it("should not be ok", () => {
                expect(validator.validate("delegateUsername", "AbCdEfG").error).not.toBeNull();
                expect(validator.validate("delegateUsername", "longerthantwentycharacterslong").error).not.toBeNull();
                expect(validator.validate("delegateUsername", 1234).error).not.toBeNull();
                expect(validator.validate("delegateUsername", "").error).not.toBeNull();
                expect(validator.validate("delegateUsername", null).error).not.toBeNull();
                expect(validator.validate("delegateUsername", undefined).error).not.toBeNull();
            });
        });

        describe("block", () => {
            beforeAll(() => {
                TransactionTypeFactory.get(0); // Make sure registry is loaded, since it adds the "transactions" schema.
                configManager.setFromPreset("unitnet");
            });

            it("should be ok", () => {
                expect(validator.validate("block", block2).error).toBeNull();
                expect(validator.validate("block", genesisBlock).error).toBeNull();
            });

            it("should not be ok", () => {
                block2.numberOfTransactions = 1;
                expect(validator.validate("block", block2).error).not.toBeNull();
                block2.numberOfTransactions = 11;
                expect(validator.validate("block", block2).error).not.toBeNull();
                block2.numberOfTransactions = 10;
                expect(validator.validate("block", block2).error).toBeNull();
            });
        });
    });

    describe("extend", () => {
        it("should extend transaction schema", () => {
            const customTransactionSchema = { $id: "custom" } as TransactionSchema;
            validator.extendTransaction(customTransactionSchema);
            expect(validator.getInstance().getSchema("custom")).not.toBeNull();
        });
    });

    describe("instance", () => {
        it("should return the instance", () => {
            expect(validator.getInstance()).toBeInstanceOf(ajv);
        });
    });
});
